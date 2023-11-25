import { from, concatMap, skip, filter, startWith, EMPTY, map, concat, defaultIfEmpty, ignoreElements, tap } from "rxjs";
import { clocByfile$, clocByfileHeader } from "../cloc-functions/cloc";
import { ClocParams } from "../cloc-functions/cloc-params";
import { gitRepoPaths } from "../git-functions/repo-path";
import { checkoutRepoAtDate$ } from "../git-functions/repo";
import { CheckoutError } from "../git-functions/repo.errors";
import { toYYYYMMDD } from "../tools/dates/date-functions";
import path from "path";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";
import { appendFileObs } from "observable-fs";

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date and returns 
 * an Observable that emits the LOC data.
 * To bring the repositories to the state they were at the specified date, the function uses the git checkout command.
 * @param folderPath The path to the folder containing the repositories.
 * @param date The date to calculate the LOC at.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories.
 */
export function clocAtDateByFileForRepos$(
    folderPath: string,
    date: Date,
    outDir = './',
    excludeRepoPaths: string[] = [],
    notMatch: string[] = [],
) {
    const repos = gitRepoPaths(folderPath, excludeRepoPaths)
    return from(repos).pipe(
        concatMap((repoPath) => {
            return checkoutRepoAtDate$(repoPath, date)
        }),
        concatMap((repoPath) => {
            if (repoPath instanceof CheckoutError) {
                console.warn('checkoutRepoAtDate$ error', repoPath);
                return EMPTY
            }
            const params: ClocParams = {
                folderPath: repoPath,
                vcs: 'git',
                outDir,
                notMatch,
            };
            return clocByfile$(params, 'clocByFileForRepos$ running on ' + repoPath, false).pipe(
                // remove the first line which contains the csv header form all the streams representing
                // the output of the cloc command execution on each repo
                skip(1),
                // remove the last line which contains the total
                filter((line) => line.slice(0, 3) !== 'SUM'),
                map((line) => {
                    // add the repopath and the date in YYYY-MM-DD format at the end of each line
                    return `${line},${repoPath},${toYYYYMMDD(date)}`;
                })
            );
        }),
        startWith(`${clocByfileHeader},repo,date`)
    );
}

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates and returns 
 * an Observable that emits the LOC data.
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
    outDir = './',
    excludeRepoPaths: string[] = [],
    notMatch: string[] = [],
) {
    return concat(
        clocAtDateByFileForRepos$(folderPath, from, outDir, excludeRepoPaths, notMatch),
        clocAtDateByFileForRepos$(folderPath, to, outDir, excludeRepoPaths, notMatch)
    )
}

export function writeClocFromToDateByFileForRepos$(
    folderPath: string,
    from: Date,
    to: Date,
    outDir = './',
    excludeRepoPaths: string[] = [],
    notMatch: string[] = [],
) {
    const folderName = path.basename(folderPath);
    const outFile = `cloc-${folderName}-${toYYYYMMDD(from)}_${toYYYYMMDD(to)}.csv`;
    const outFilePath = path.join(outDir, outFile);
    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocFromToDateByFileForRepos$(folderPath, from, to, outDir, excludeRepoPaths, notMatch)),
        concatMap((line) => {
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                console.log(`====>>>> cloc info at dates ${toYYYYMMDD(from)} and ${toYYYYMMDD(to)} saved on file ${outFilePath}`);
            },
        }),
    );
}