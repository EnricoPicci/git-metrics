import path from "path"
import { forkJoin, concatMap, defaultIfEmpty, ignoreElements, tap, map, catchError, EMPTY } from "rxjs"

import { toCsvObs } from "@enrico.piccinin/csv-tools"
import { appendFileObs } from "observable-fs"

import { clocDiffRelByfileWithCommitData$ } from "../cloc-functions/cloc-diff-byfile"
import { commitAtDateOrAfter$, commitAtDateOrBefore$, repoPathAndFromDates$ } from "../git-functions/commit"
import { toYYYYMMDD } from "../tools/dates/date-functions"
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils"
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing"
import { gitRepoPaths } from "../git-functions/repo-path"
import { defaultBranchName$ } from "../git-functions/branches"


/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository 
 * and returns an Observable that emits the cloc difference.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates 
 * the cloc difference between these two commits for each file.
 * If no commit is found at the 'fromDate' or 'toDate', the function fetches the closest commit to the respective date.
 * The function also allows filtering by programming languages and excluding certain directories.
 *
 * @param {Date} fromDate - The start date for which to calculate the cloc difference.
 * @param {Date} toDate - The end date for which to calculate the cloc difference.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference. Defaults to 'master'.
 * @param {string} repoFolderPath - The path to the Git repository. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @param {Object} progress - An object to track the progress of the cloc calculation. Defaults to an object with 'totNumOfCommits', 'commitCounter', and 'errorCounter' all set to 0.
 * @param {string[]} notMatchDirectories - An array of directories to exclude from the cloc calculation. Defaults to an empty array (no exclusions).
 * @returns {Observable} An Observable that emits the cloc difference between the two dates for each file.
 */
export function clocDiffBetweenDates$(
    fromDate: Date,
    toDate: Date,
    branchName = 'master',
    repoFolderPath = './',
    languages: string[] = [],
    notMatchDirectories: string[] = []
) {
    const fromCommit = commitAtDateOrAfter$(repoFolderPath, fromDate, branchName)
    const toCommit = commitAtDateOrBefore$(repoFolderPath, toDate, branchName)

    return forkJoin([fromCommit, toCommit]).pipe(
        concatMap(([[fromSha], [toSha]]) => {
            return clocDiffRelByfileWithCommitData$(toSha, fromSha, repoFolderPath, languages, notMatchDirectories,)
        }),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${repoFolderPath}"`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            return EMPTY;
        })
    )
}

export function clocDiffBetweenDatesForRepos$(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    excludeRepoPaths: string[] = [],
    languages: string[] = [],
    creationDateCsvFilePath: string | null = null,
) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);

    let _repoPath = ''

    return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe(
        concatMap(({ repoPath, _fromDate }) => {
            _repoPath = repoPath
            return defaultBranchName$(repoPath).pipe(
                map((branchName) => ({ repoPath, _fromDate, branchName })),
                catchError((err) => {
                    console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${_repoPath}"`);
                    console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
                    return EMPTY;
                })
            )
        }),
        concatMap(({ repoPath, _fromDate, branchName }) => {
            return clocDiffBetweenDates$(_fromDate, toDate, branchName, repoPath, languages)
        }),
    )
}


/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository 
 * and writes the results to a CSV file.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates 
 * the cloc difference between these two commits for each file.
 * If no commit is found at the 'fromDate' or 'toDate', the function fetches the closest commit to the respective date.
 * The function also allows filtering by programming languages.
 *
 * @param {string} pathToRepo - The path to the Git repository.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference.
 * @param {Date} fromDate - The start date for which to calculate the cloc difference. Defaults to the Unix epoch (1970-01-01 00:00:00 UTC).
 * @param {Date} toDate - The end date for which to calculate the cloc difference. Defaults to the current date and time.
 * @param {string} outDir - The directory where to save the CSV file. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @returns {Observable} An Observable that completes when the CSV file has been written and emits the path to the CSV file.
 */
export function writeClocDiffBetweenDates$(
    pathToRepo: string,
    branchName: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    outDir = './',
    languages: string[] = []
) {
    const pathToRepoName = path.basename(pathToRepo);
    const outFile = `${pathToRepoName}-cloc-diff-between-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffBetweenDates$(fromDate, toDate, branchName, pathToRepo, languages)),
        toCsvObs(),
        concatMap((line) => {
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                console.log(`====>>>> cloc-diff-between-dates info saved on file ${outFilePath}`);
            },
        }),
    )
}


export function writeClocDiffBetweenDatesForRepos$(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    outDir = './',
    excludeRepoPaths: string[] = [],
    languages: string[] = [],
    creationDateCsvFilePath: string | null = null,
) {
    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-commit-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    let noCommitsFound = true;

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffBetweenDatesForRepos$(folderPath, fromDate, toDate, excludeRepoPaths, languages, creationDateCsvFilePath)),
        toCsvObs(),
        concatMap((line) => {
            noCommitsFound = false;
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                if (noCommitsFound) {
                    console.log(`\n====>>>> no commits found in the given time range, for the given languages, in the given repos`);
                    return;
                }
                console.log(`\n====>>>> cloc-diff-commit-for-repos info saved on file ${outFilePath}`);
            },
        }),
    )
}