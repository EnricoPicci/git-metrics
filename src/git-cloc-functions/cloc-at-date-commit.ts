import path from "path";
import { from, concatMap, skip, filter, startWith, map, concat, tap, last, toArray, catchError, of } from "rxjs";

import { appendFileObs } from "observable-fs";

import { clocByfile$, clocByfileHeader, toClocFileDict } from "../cloc-functions/cloc";
import { ClocParams } from "../cloc-functions/cloc-params";
import { gitRepoPaths } from "../git-functions/repo-path";
import { checkoutRepoAtCommit$, checkoutRepoAtDate$ } from "../git-functions/repo";
import { GitError } from "../git-functions/git-errors";
import { toYYYYMMDD } from "../tools/dates/date-functions";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils";
import { ExecuteCommandObsOptions, writeCmdLogs$ } from "../tools/execute-command/execute-command";
import { calcArea } from "./derived-fields";

/**
 * This function calculates the lines of code (cloc data) at the specified date (or at the date before if no commit is found at that date) 
 * for each file in a Git repository and returns an Observable that emits the cloc data in form of a string.
 * The function fetches the commit at or before the specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified date.
 */
export function clocAtDateByFile$(repoPath: string, date: Date, options?: ClocOptions) {
    return checkoutRepoAtDate$(repoPath, date, options).pipe(
        concatMap((repoPathSha) => {
            const params: ClocParams = {
                folderPath: repoPathSha.repoPath,
                vcs: 'git',
                notMatch: options?.notMatch,
                languages: options?.languages,
            };
            return clocByfile$(params, 'clocByFileForRepos$ running on ' + repoPathSha.repoPath, false).pipe(
                map((line) => {
                    return {
                        line,
                        sha: repoPathSha.sha,
                        commitDate: repoPathSha.commitDate,
                    }
                })
            )
        }),
    )
}

/**
 * This function calculates the lines of code (cloc) at a specified commit for each file in a Git repository and 
 * returns an Observable that emits the cloc info in the form of string.
 * The function checks out the repository at the specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} sha - The SHA of the commit for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified commit.
 */
export function clocAtCommitByFile$(repoPath: string, sha: string, options?: ClocOptions) {
    return checkoutRepoAtCommit$(repoPath, sha, options).pipe(
        concatMap(() => {
            const params: ClocParams = {
                folderPath: repoPath,
                vcs: 'git',
                notMatch: options?.notMatch,
                languages: options?.languages,
            };
            return clocByfile$(params, 'clocByFileForRepos$ running on ' + repoPath, false)
        }),
    )
}

/**
 * This function calculates the lines of code (cloc) at a specified date (or at the date before if no commit is found at that date)
 * for each file in a Git repository and returns an Observable that emits the cloc info along with additional information.
 * The function fetches the commit at or before the specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 * In addition to the cloc, the function also emits the path to the repository, the date in YYYY-MM-DD format, the directory of the file, the name of the repository, the directory of the repository, the SHA of the commit, and the first directory in the repository path after removing the path to the folder containing the repository.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} reposFolderPath - The path to the folder containing the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified date along with additional information.
 */
export function clocAtDateByFileEnriched$(repoPath: string, reposFolderPath: string, date: Date, options: ClocOptions) {
    return clocAtDateByFile$(repoPath, date, options).pipe(
        // remove the first line which contains the csv header form all the streams representing
        // the output of the cloc command execution on each repo
        skip(1),
        // remove the last line which contains the total
        filter((lineSha) => lineSha.line.slice(0, 3) !== 'SUM'),
        map((lineSha) => {
            const { line, sha, commitDate } = lineSha;
            // area is the first folder in the repo path after removing reposFolderPath
            const area = calcArea(repoPath, reposFolderPath);

            const fields = line.split(',');
            const filePath = fields[1];
            const module = path.dirname(filePath);

            const repoPathParts = repoPath.split(path.sep);
            const numberOfRepoPathParts = repoPathParts.length;
            const repoName = repoPathParts[numberOfRepoPathParts - 1];
            const repoDirName = numberOfRepoPathParts > 1 ?
                repoPathParts[numberOfRepoPathParts - 2] : '-';
            // add the repopath and the date in YYYY-MM-DD format at the end of each line
            return `${line},${repoPath},${toYYYYMMDD(date)},${module},${repoName},${repoDirName},${sha},${commitDate},${area}`;
        })
    );
}

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date (or at the date before if no commit is 
 * found at that date) and returns an Observable that emits the LOC data.
 * To bring the repositories to the state they were at the specified date, the function uses the git checkout command.
 * If an error is encountered while calculating the LOC for a certain repo, it will emit an error and move to the next repo.
 * @param reposFolderPath The path to the folder containing the repositories.
 * @param date The date to calculate the LOC at.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories or an error.
 */
export function clocAtDateByFileForRepos$(
    reposFolderPath: string,
    date: Date,
    options: ClocOptions
) {
    const repos = gitRepoPaths(reposFolderPath, options.excludeRepoPaths)
    return from(repos).pipe(
        concatMap((repoPath, i) => {
            console.log(`clocAtDateByFileForRepos$ processing repo ${i + 1} of ${repos.length}`)
            return clocAtDateByFileEnriched$(repoPath, reposFolderPath, date, options).pipe(
                catchError((err) => {
                    if (err instanceof GitError) {
                        return of(err)
                    }
                    throw err;
                })
            );
        }),
        startWith(`${clocByfileHeader},repo,date,module,repoName,repoDirName,sha,commitDate,area`),
    );
}

/**
 * This function calculates the lines of code (cloc) at a specified date (or at the date before if no commit is found at that date)
 * for each file in a Git repository and returns an Observable that emits a dictionary with the cloc info 
 * and the sha at which the repo has been checked out.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at the specified date or an error if the checkout fails.
 */
export function clocFileDictAtDate$(repoPath: string, date: Date, options?: ClocOptions) {
    let _sha = '';
    let _commitDate = ''
    return clocAtDateByFile$(repoPath, date, options).pipe(
        map((lineSha) => {
            const { line, sha, commitDate } = lineSha;
            _sha = sha;
            _commitDate = commitDate;
            return line;
        }),
        toArray(),
        toClocFileDict(repoPath),
        map((dict) => {
            return {
                dict,
                sha: _sha,
                commitDate: _commitDate,
            }
        })
    );
}

/**
 * This function calculates the lines of code (cloc) at a specified commit for each file in a Git repository and 
 * returns an Observable that emits a dictionary with the cloc info.
 * The function checks out the repository at the specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} sha - The SHA of the commit for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at the specified commit.
 */
export function clocFileDictAtCommit$(repoPath: string, sha: string, options?: ClocOptions) {
    return clocAtCommitByFile$(repoPath, sha, options).pipe(
        toArray(),
        toClocFileDict(repoPath),
        map((dict) => {
            return dict
        })
    );
}

/**
 * This function calculates the lines of code (cloc) at specified dates for each file in a Git repository and returns 
 * an Observable that emits a dictionary with the cloc info for each date.
 * The function fetches the commit at or closest to each specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date[]} dates - An array of dates for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at each specified date.
 */
export function clocFileDictAtDates$(repoPath: string, dates: Date[], options?: ClocOptions) {
    const clocDictAtDates$ = dates.map(date => clocFileDictAtDate$(repoPath, date, options));
    return concat(...clocDictAtDates$);
}

/**
 * This function calculates the lines of code (cloc) at specified commits for each file in a Git repository and 
 * returns an Observable that emits a dictionary with the cloc info for each commit.
 * The function checks out the repository at each specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string[]} shas - An array of SHAs of the commits for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at each specified commit.
 */
export function clocFileDictAtCommits$(repoPath: string, shas: string[], options?: ClocOptions) {
    const clocDictAtCommit$ = shas.map(sha => clocFileDictAtCommit$(repoPath, sha, options));
    return concat(...clocDictAtCommit$);
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
    options: ClocOptions
) {
    return concat(
        clocAtDateByFileForRepos$(folderPath, from, options),
        clocAtDateByFileForRepos$(folderPath, to, options).pipe(
            // skip the first line which contains the csv header
            skip(1),
        )
    )
}

/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates, 
 * writes the LOC data to a CSV file, and returns an Observable that emits when the operation is complete.
 * If errors are encountered they will be written to a separate file.
 * @param reposFolderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param options An object containing options for the operation. Defaults to an object with the outDir property set to './', 
 * and the excludeRepoPaths and notMatch properties set to empty arrays.
 * @returns An Observable that emits when the operation is complete.
 * @throws An error if the outDir property in the options parameter is not provided.
 */
export function writeClocFromToDateByFileForRepos$(
    reposFolderPath: string,
    from: Date,
    to: Date,
    options: WriteClocAtDateOptions = {
        outDir: './',
        excludeRepoPaths: [],
        notMatch: [],
    },
) {
    const start = new Date();
    const { outDir } = options;
    if (!outDir) {
        throw new Error('outDir is required');
    }
    const folderName = path.basename(reposFolderPath);
    const outFile = `cloc-${folderName}-${toYYYYMMDD(from)}_${toYYYYMMDD(to)}`;
    const csvOutFilePath = path.join(outDir, outFile) + '.csv';
    const errorOutFilePath = path.join(outDir, outFile) + '.error.log';
    createDirIfNotExisting(outDir);
    let atLeastOneCsv = false;
    let atLeastOneError = false;
    return deleteFile$(csvOutFilePath).pipe(
        concatMap(() => deleteFile$(errorOutFilePath)),
        concatMap(() => clocFromToDateByFileForRepos$(reposFolderPath, from, to, options)),
        concatMap((line) => {
            if (line instanceof GitError) {
                atLeastOneError = true;
                const erroringRepo = `Error in repo ${line.repoPath}\n` + `${line.message}\n`;
                return appendFileObs(errorOutFilePath, erroringRepo);
            }
            atLeastOneCsv = true;
            return appendFileObs(csvOutFilePath, `${line}\n`);
        }),
        last(),
        concatMap(() => writeCmdLogs$(options, outDir)),
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
                const end = new Date();
                console.log(`====>>>> writeClocFromToDateByFileForRepos$ completed in ${(end.getTime() - start.getTime()) / 1000} seconds`);
            },
        }),
    );
}

export type ClocOptions = {
    excludeRepoPaths?: string[],
    notMatch?: string[],
    creationDateCsvFilePath?: string,
    stdErrorHandler?: (stderr: string) => Error | null
    branch?: string,
    languages?: string[],
} & ExecuteCommandObsOptions

export type WriteClocAtDateOptions = {
    outDir?: string,
} & ClocOptions