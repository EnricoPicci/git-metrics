import path from "path";
import { from, concatMap, skip, filter, startWith, map, concat, ignoreElements, tap, of } from "rxjs";

import { appendFileObs } from "observable-fs";

import { clocByfile$, clocByfileHeader } from "../cloc-functions/cloc";
import { ClocParams } from "../cloc-functions/cloc-params";
import { gitRepoPaths } from "../git-functions/repo-path";
import { checkoutRepoAtDate$ } from "../git-functions/repo";
import { CheckoutError } from "../git-functions/repo.errors";
import { toYYYYMMDD } from "../tools/dates/date-functions";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date and returns 
 * an Observable that emits the LOC data.
 * To bring the repositories to the state they were at the specified date, the function uses the git checkout command.
 * If an error is encountered while calculating the LOC for a certain repo, it will emit an error and move to the next repo.
 * @param folderPath The path to the folder containing the repositories.
 * @param date The date to calculate the LOC at.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories or an error.
 */
export function clocAtDateByFileForRepos$(
    folderPath: string,
    date: Date,
    options: WriteClocAtDateOptions
) {
    const { outDir, excludeRepoPaths, notMatch } = options;
    const repos = gitRepoPaths(folderPath, excludeRepoPaths)
    return from(repos).pipe(
        concatMap((repoPath) => {
            // piping the cloc calculation into the Observable returned by checkoutRepoAtDate$ makes sure that the 
            // cloc calculation is done on the repo just after the checkout is done
            // Otherwise, if we move the cloc calculation up one level, i.e. in the same pipe were the checkout is done,
            // we would obtain a solution where the checkouts are performed massively while we wait for the cloc calculation
            // to complete on the first repo.
            // The net result would be the same, but we would see the checkouts completing fast and the cloc completing slowly
            // which is correct since the cloc calculation is the slowest part of the process, but could be more diffucult to 
            // to follow looking simply at the logs.
            return checkoutRepoAtDate$(repoPath, date, options).pipe(
                concatMap((repoPathOrError) => {
                    if (repoPathOrError instanceof CheckoutError) {
                        console.warn('checkoutRepoAtDate$ error', repoPathOrError);
                        return of(repoPathOrError);
                    }
                    const params: ClocParams = {
                        folderPath: repoPathOrError,
                        vcs: 'git',
                        outDir,
                        notMatch,
                    };
                    return clocByfile$(params, 'clocByFileForRepos$ running on ' + repoPathOrError, false).pipe(
                        // remove the first line which contains the csv header form all the streams representing
                        // the output of the cloc command execution on each repo
                        skip(1),
                        // remove the last line which contains the total
                        filter((line) => line.slice(0, 3) !== 'SUM'),
                        map((line) => {
                            // add the repopath and the date in YYYY-MM-DD format at the end of each line
                            return `${line},${repoPathOrError},${toYYYYMMDD(date)}`;
                        })
                    );
                }),
            )
        }),
        startWith(`${clocByfileHeader},repo,date`)
    );
}

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates and returns 
 * an Observable that emits the LOC data.
 * If an error is encountered while calculating the LOC, the Observable will emit the error and complete.
 * @param folderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param outDir The directory to write the output files to. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories at the two dates.
 */
export function clocFromToDateByFileForRepos$(
    folderPath: string,
    from: Date,
    to: Date,
    options: WriteClocAtDateOptions
) {
    return concat(
        clocAtDateByFileForRepos$(folderPath, from, options),
        clocAtDateByFileForRepos$(folderPath, to, options)
    )
}

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates, 
 * writes the LOC data to a CSV file, and returns an Observable that emits when the operation is complete.
 * If errors are encountered they will be written to a separate file.
 * @param folderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param options An object containing options for the operation. Defaults to an object with the outDir property set to './', 
 * and the excludeRepoPaths and notMatch properties set to empty arrays.
 * @returns An Observable that emits when the operation is complete.
 * @throws An error if the outDir property in the options parameter is not provided.
 */
export function writeClocFromToDateByFileForRepos$(
    folderPath: string,
    from: Date,
    to: Date,
    options: WriteClocAtDateOptions = {
        outDir: './',
        excludeRepoPaths: [],
        notMatch: [],
        branch: 'master'
    },
) {
    const { outDir } = options;
    if (!outDir) {
        throw new Error('outDir is required');
    }
    const folderName = path.basename(folderPath);
    const outFile = `cloc-${folderName}-${toYYYYMMDD(from)}_${toYYYYMMDD(to)}`;
    const csvOutFilePath = path.join(outDir, outFile) + '.csv';
    const errorOutFilePath = path.join(outDir, outFile) + '.error.log';
    let atLeastOneCsv = false;
    let atLeastOneError = false;
    return deleteFile$(csvOutFilePath).pipe(
        concatMap(() => deleteFile$(errorOutFilePath)),
        concatMap(() => clocFromToDateByFileForRepos$(folderPath, from, to, options)),
        concatMap((line) => {
            if (line instanceof CheckoutError) {
                atLeastOneError = true;
                const erroringRepo = `Error checking out ${line.repoPath}\n` + `${line.error.message}\n`;
                return appendFileObs(errorOutFilePath, erroringRepo);
            }
            atLeastOneCsv = true;
            return appendFileObs(csvOutFilePath, `${line}\n`);
        }),
        ignoreElements(),
        tap({
            complete: () => {
                if (atLeastOneCsv) {
                    console.log(`====>>>> cloc info at dates ${toYYYYMMDD(from)} and ${toYYYYMMDD(to)} saved on file ${csvOutFilePath}`);
                }
                if (atLeastOneError) {
                    console.log(`====>>>> errors saved on file ${errorOutFilePath}`);
                } else {
                    console.log(`====>>>> No errors encountered`);
                }
            },
        }),
    );
}

export type WriteClocAtDateOptions = {
    outDir?: string,
    excludeRepoPaths?: string[],
    notMatch?: string[],
    stdErrorHandler?: (stderr: string) => Error | null
    branch: string
}