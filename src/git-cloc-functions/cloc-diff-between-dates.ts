import path from "path"
import { forkJoin, concatMap, defaultIfEmpty, ignoreElements, tap, map, catchError, EMPTY, last } from "rxjs"

import { toCsvObs } from "@enrico.piccinin/csv-tools"
import { appendFileObs } from "observable-fs"

import { clocDiffRelByfileWithCommitData$, } from "../cloc-functions/cloc-diff-byfile"
import { commitAtDateOrBefore$, repoPathAndFromDates$ } from "../git-functions/commit"
import { toYYYYMMDD } from "../tools/dates/date-functions"
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils"
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing"
import { gitRepoPaths } from "../git-functions/repo-path"
import { defaultBranchName$ } from "../git-functions/branches"
import { ExecuteCommandObsOptions, writeCmdLogs$ } from "../tools/execute-command/execute-command"
import { clocFileDict$ } from "../cloc-functions/cloc-dictionary"
import { ClocFileInfo } from "../cloc-functions/cloc.model"
import { ClocDiffCommitBetweenDatesEnriched } from "./cloc-diff-commit.model"


/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository 
 * and returns an Observable that emits the cloc difference.
 * The function fetches the commit at or before the 'fromDate' and the commit at or before the 'toDate' and calculates 
 * the cloc difference between these two commits for each file.
 *
 * @param {Date} fromDate - The start date for which to calculate the cloc difference.
 * @param {Date} toDate - The end date for which to calculate the cloc difference.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference. Defaults to 'master'.
 * @param {string} repoPath - The path to the Git repository. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @param {Object} progress - An object to track the progress of the cloc calculation. Defaults to an object with 'totNumOfCommits', 'commitCounter', and 'errorCounter' all set to 0.
 * @param {string[]} notMatchDirectories - An array of directories to exclude from the cloc calculation. Defaults to an empty array (no exclusions).
 * @returns {Observable} An Observable that emits the cloc difference between the two dates for each file.
 */
export function clocDiffBetweenDates$(
    fromDate: Date,
    toDate: Date,
    branchName: string,
    repoPath = './',
    reposFolderPath = './',
    languages: string[] = [],
    notMatchDirectories: string[] = [],
    options?: ExecuteCommandObsOptions
) {
    // if fromDate is after toDate, swap the two dates
    if (fromDate > toDate) {
        const temp = fromDate;
        fromDate = toDate;
        toDate = temp;
        console.log(`====>>>> fromDate is after toDate, swapping the two dates`);
    }
    const fromCommit = commitAtDateOrBefore$(repoPath, fromDate, branchName, options)
    const toCommit = commitAtDateOrBefore$(repoPath, toDate, branchName, options)

    const _clocFileDict$ = clocFileDict$(repoPath, languages, options).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`!!!!!!!! folder ${repoPath} not found`);
                process.exit(1);
            }
            throw err;
        }),
    )

    return forkJoin([fromCommit, toCommit, _clocFileDict$]).pipe(
        concatMap(([[fromSha], [toSha], clocDict]) => {
            return clocDiffRelByfileWithCommitData$(toSha, fromSha, repoPath, languages, notMatchDirectories, options).pipe(
                map((clocDiff) => {
                    return { clocDiff, clocDict, toSha, fromSha }
                })
            )
        }),
        // now enrich the cloc diff with the cloc dictionary and the commit data
        map(({ clocDiff, clocDict, toSha, fromSha }) => {
            const module = path.dirname(clocDiff.file);
            // // remove the starting repoPath from the _module path
            // const module = _module.substring(repoPath.length + 1);

            // area is the first folder in the repo path after removing reposFolderPath
            const area = repoPath.split(reposFolderPath)[1].split(path.sep)[1];

            // normalize the file path so that it starts always with a './'. The reason is that the clocDict
            // is built with the cloc command which returns file names starting with './' while the file path
            // in the clocDiff is built using the git log --numstat command which returns file names without './'
            const filePath = clocDiff.file.startsWith('./') ? clocDiff.file : `./${clocDiff.file}`
            let clocInfo: ClocFileInfo = clocDict[filePath]
            if (!clocInfo) {
                clocInfo = {
                    code: 0,
                    comment: 0,
                    blank: 0,
                    language: '',
                    file: clocDiff.file
                }
            }
            const clocDiffCommitEnriched: ClocDiffCommitBetweenDatesEnriched = {
                ...clocDiff,
                ...clocInfo,
                fromSha,
                toSha,
                repo: repoPath,
                module,
                area
            }
            // set the file path relative to the current working directory to make it easier to read and possibly to link
            clocDiffCommitEnriched.file = path.relative(process.cwd(), clocDiffCommitEnriched.file)
            // delete the commit_code fields because are not relevant for the cloc diff between 2 specific dates
            delete (clocDiffCommitEnriched as any).commit_code_added
            delete (clocDiffCommitEnriched as any).commit_code_removed
            delete (clocDiffCommitEnriched as any).commit_code_modified
            delete (clocDiffCommitEnriched as any).commit_code_same

            return clocDiffCommitEnriched
        }),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${repoPath}"`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            return EMPTY;
        }),
    )
}

export function clocDiffBetweenDatesForRepos$(
    reposFolderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    options: WriteClocDiffBetweenDatesOptions
) {
    const { excludeRepoPaths, creationDateCsvFilePath, notMatch } = options;
    const repoPaths = gitRepoPaths(reposFolderPath, excludeRepoPaths);

    let _repoPath = ''

    return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe(
        concatMap(({ repoPath, _fromDate }) => {
            _repoPath = repoPath
            return defaultBranchName$(repoPath, options).pipe(
                map((branchName) => ({ repoPath, _fromDate, branchName })),
                catchError((err) => {
                    console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${_repoPath}"`);
                    console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
                    return EMPTY;
                })
            )
        }),
        concatMap(({ repoPath, _fromDate, branchName }) => {
            const { languages } = options
            return clocDiffBetweenDates$(_fromDate, toDate, branchName, repoPath, reposFolderPath, languages, notMatch, options)
        }),
    )
}


/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository 
 * and writes the results to a CSV file.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates 
 * the cloc difference between these two commits for each file.
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
        concatMap(() => clocDiffBetweenDates$(fromDate, toDate, branchName, pathToRepo, '', languages)),
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
    options: WriteClocDiffBetweenDatesOptions = {
        excludeRepoPaths: [],
        notMatch: [],
    }
) {
    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-commit-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    let noCommitsFound = true;

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffBetweenDatesForRepos$(folderPath, fromDate, toDate, options)),
        toCsvObs(),
        concatMap((line) => {
            noCommitsFound = false;
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        last(),
        tap({
            next: () => {
                if (noCommitsFound) {
                    console.log(`\n====>>>> no commits found in the given time range, for the given languages, in the given repos`);
                    return;
                }
                console.log(`\n====>>>> cloc-between-dates-for-repos info saved on file ${outFilePath}`);
            },
        }),
        concatMap(() => writeCmdLogs$(options, outDir)),
    )
}
export type WriteClocDiffBetweenDatesOptions = {
    excludeRepoPaths?: string[],
    notMatch?: string[],
    languages?: string[],
    creationDateCsvFilePath?: string
} & ExecuteCommandObsOptions