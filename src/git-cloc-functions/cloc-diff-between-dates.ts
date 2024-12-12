import path from "path"
import { forkJoin, concatMap, defaultIfEmpty, ignoreElements, tap, map, catchError, EMPTY, last, toArray, share, of, } from "rxjs"

import { toCsvObs } from "@enrico.piccinin/csv-tools"
import { appendFileObs } from "observable-fs"

import { clocDiffRelByfileWithCommitData$, } from "../cloc-functions/cloc-diff-byfile"
import { commitAtDateOrBefore$ } from "../git-functions/commit"
import { repoPathAndFromDates$ } from '../git-functions/repo'
import { toYYYYMMDD } from "../tools/dates/date-functions"
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils"
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing"
import { gitRepoPaths } from "../git-functions/repo-path"
import { defaultBranchName$ } from "../git-functions/branches"
import { ClocFileInfo } from "../cloc-functions/cloc.model"
import { ClocDiffCommitBetweenDatesEnriched } from "./cloc-diff-commit.model"
import { ClocOptions, clocFileDictAtCommits$, } from "./cloc-at-date-commit"
import { CmdErrored, writeCmdLogs$ } from "../tools/execute-command/execute-command"
import { newClocDiffByfile } from "../cloc-functions/cloc-diff-byfile.model"
import { calcArea } from "./derived-fields"


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
    options?: ClocOptions
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

    const fromToCommits$ = forkJoin([fromCommit, toCommit]).pipe(share())

    return fromToCommits$.pipe(
        concatMap(([fromShaDate, toShaDate]) => {
            const [fromSha, _fromDate] = fromShaDate
            const [toSha, _toDate] = toShaDate
            // if fromSha and toSha are the same, then we have not found any commit at or before the fromDate
            // and therefore we respond with an Observable that emits an empty array
            if (fromSha === toSha) {
                const errMsg = `No commit found at or before the fromDate "${toYYYYMMDD(fromDate)}" for repo "${repoPath}"`
                const errObj: CmdErrored = {
                    command: `no command run because no commit found at or before the fromDate "${toYYYYMMDD(fromDate)}" for repo "${repoPath}"`,
                    message: errMsg
                }
                options?.cmdErroredLog?.push(errObj)
                return of([])
            }
            // if both fromSha and toSha are not empty, then we have found the commits at the two dates
            // and therefore we can calculate the cloc diff between the two commits
            if (fromSha && toSha) {
                const _fromShaDate = [fromSha, new Date(_fromDate)] as [string, Date]
                const _toShaDate = [toSha, new Date(_toDate)] as [string, Date]
                return calcDiffBetweenTwoCommits$(repoPath, reposFolderPath, _fromShaDate, _toShaDate, languages, notMatchDirectories, options)
            }
            // if fromSha is empty, then we have not found a commit at or before the fromDate and therefore
            // we calculate only the cloc for the toDate commit with all the values set to 0 for the fromDate
            else if (!fromSha) {
                return calcDiffWithOneCommit$(repoPath, reposFolderPath, toDate, toSha, options)
            }
            // if we arrive here it is because both fromSha and toSha are empty, which means that we have not found any commit
            else {
                return EMPTY
            }
        }),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!!>> Error: while calculating cloc diff between dates for repo "${repoPath}"`);
            console.error(`!!!!!!!!!!!!!!!>> error message: ${err.message}`);
            console.error(`!!!!!!!!!!!!!!!>> stack: ${err.stack}`);
            return EMPTY;
        })
    )
}
function calcDiffBetweenTwoCommits$(
    repoPath: string,
    reposFolderPath: string,
    fromShaDate: [string, Date],
    toShaDate: [string, Date],
    languages: string[] = [],
    notMatchDirectories: string[] = [],
    options?: ClocOptions
) {
    const [fromSha] = fromShaDate
    const [toSha] = toShaDate
    return clocFileDictAtCommits$(repoPath, [fromSha, toSha], options).pipe(
        toArray(),
        map((clocDicts) => {
            return { fromShaDate, toShaDate, fromDateClocDict: clocDicts[0], toDateClocDict: clocDicts[1] }
        }),
        concatMap(({ fromShaDate, toShaDate, fromDateClocDict, toDateClocDict }) => {
            const fromSha = fromShaDate[0]
            const toSha = toShaDate[0]
            return clocDiffRelByfileWithCommitData$(toSha, fromSha, repoPath, languages, notMatchDirectories, options).pipe(
                map((clocDiff) => {
                    return { clocDiff, fromDateClocDict, toDateClocDict, fromShaDate, toShaDate }
                })
            )
        }),
        // now enrich the cloc diff with the cloc dictionary and the commit data
        map(({ clocDiff, fromDateClocDict, toDateClocDict, fromShaDate, toShaDate }) => {
            const [fromSha, _fromDate] = fromShaDate
            const [toSha, _toDate] = toShaDate

            const module = path.dirname(clocDiff.file);

            // area is the first folder in the repo path after removing reposFolderPath
            const area = calcArea(repoPath, reposFolderPath);

            // normalize the file path so that it starts always with a './'. The reason is that the clocDict
            // is built with the cloc command which returns file names starting with './' while the file path
            // in the clocDiff is built using the git log --numstat command which returns file names without './'
            const filePath = clocDiff.file.startsWith('./') ? clocDiff.file : `./${clocDiff.file}`

            let _fromDateClocInfo: ClocFileInfo = fromDateClocDict[filePath]
            let _toDateClocInfo: ClocFileInfo = toDateClocDict[filePath]

            const language = _fromDateClocInfo?.language || _toDateClocInfo?.language

            const fromDateClocInfo = {
                from_code: _fromDateClocInfo ? _fromDateClocInfo.code : 0,
                from_comment: _fromDateClocInfo ? _fromDateClocInfo.comment : 0,
                from_blank: _fromDateClocInfo ? _fromDateClocInfo.blank : 0,
            }
            const toDateClocInfo = {
                to_code: _toDateClocInfo ? _toDateClocInfo.code : 0,
                to_comment: _toDateClocInfo ? _toDateClocInfo.comment : 0,
                to_blank: _toDateClocInfo ? _toDateClocInfo.blank : 0,
            }
            const clocDiffCommitEnriched: ClocDiffCommitBetweenDatesEnriched = {
                language,
                ...clocDiff,
                ...fromDateClocInfo,
                ...toDateClocInfo,
                from_sha: fromSha,
                from_sha_date: toYYYYMMDD(_fromDate),
                to_sha: toSha,
                to_sha_date: toYYYYMMDD(_toDate),
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
            delete (clocDiffCommitEnriched as any).sumOfDiffs

            return clocDiffCommitEnriched
        }),
    )
}
function calcDiffWithOneCommit$(
    repoPath: string,
    reposFolderPath: string,
    toDate: Date,
    sha: string,
    options?: ClocOptions
) {
    return clocFileDictAtCommits$(repoPath, [sha], options).pipe(
        toArray(),
        map((clocDicts) => {
            return { sha, toDateClocDict: clocDicts[0] }
        }),
        // map the clocDictionary into an array of ClocDiffCommitBetweenDatesEnriched objects
        map(({ sha, toDateClocDict }) => {
            return Object.keys(toDateClocDict).map((file) => {
                const toDateClocInfo = toDateClocDict[file]

                const module = path.dirname(toDateClocInfo.file);

                // area is the first folder in the repo path after removing reposFolderPath
                const area = calcArea(repoPath, reposFolderPath);

                const language = toDateClocInfo.language
                const clocDiffByFile = newClocDiffByfile(file)
                clocDiffByFile.blank_added = toDateClocInfo.blank
                clocDiffByFile.comment_added = toDateClocInfo.comment
                clocDiffByFile.code_added = toDateClocInfo.code
                const clocDiffCommitEnriched: ClocDiffCommitBetweenDatesEnriched = {
                    language,
                    ...clocDiffByFile,
                    isCopy: false,
                    from_code: 0,
                    from_comment: 0,
                    from_blank: 0,
                    to_code: toDateClocInfo.code,
                    to_comment: toDateClocInfo.comment,
                    to_blank: toDateClocInfo.blank,
                    from_sha: '',
                    from_sha_date: '',
                    to_sha: sha,
                    to_sha_date: toYYYYMMDD(toDate),
                    repo: repoPath,
                    module,
                    area
                }
                // set the file path relative to the current working directory to make it easier to read and possibly to link
                clocDiffCommitEnriched.file = path.relative(process.cwd(), clocDiffCommitEnriched.file)

                return clocDiffCommitEnriched
            })
        }),
        concatMap((clocDiffCommitEnriched) => {
            return clocDiffCommitEnriched
        }),
    )
}

export function clocDiffBetweenDatesForRepos$(
    reposFolderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    options: ClocOptions
) {
    const { excludeRepoPaths, creationDateCsvFilePath, notMatch } = options;
    const repoPaths = gitRepoPaths(reposFolderPath, excludeRepoPaths);

    return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe(
        concatMap(({ repoPath, _fromDate }) => {
            return defaultBranchName$(repoPath, options).pipe(
                map((branchName) => ({ repoPath, _fromDate, branchName })),
                catchError((err) => {
                    console.error(`!!!!!!!!!!!!!!! Error: while calculating default banch name for repo "${repoPath}"`);
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
    options: ClocOptions = {
        excludeRepoPaths: [],
        notMatch: [],
        filePrefix: 'cloc-diff-between-dates',
    }
) {
    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-between-dates-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    options.cmdErroredLog = options.cmdErroredLog ?? [];
    options.cmdExecutedLog = options.cmdExecutedLog ?? [];

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
        catchError((err) => {
            if (err.name === 'EmptyError') {
                console.log(`\n====>>>> no diffs found in the given time range, for the given languages, in the given repos`);
                // we must return something (hence we can not return EMPTY) since we want the stream to continue with just one more element
                // so that we can execture the writeCmdLogs$ function and write the cmd logs to file
                return of(null);
            }
            throw err;
        }),
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