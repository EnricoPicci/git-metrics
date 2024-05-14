import path from "path";

import { EMPTY, catchError, concatMap, defaultIfEmpty, ignoreElements, map, tap } from "rxjs";

import { appendFileObs } from "observable-fs";
import { toCsvObs } from "@enrico.piccinin/csv-tools";

import { clocFileDict$ } from "../cloc-functions/cloc-dictionary";
import { clocDiffWithParentByfile$ } from "../cloc-functions/cloc-diff-byfile";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { countCommits$, readCommitCompactWithUrlAndParentDate$ } from "../git-functions/commit";
import { repoPathAndFromDates$ } from '../git-functions/repo';
import { gitRepoPaths } from "../git-functions/repo-path";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils";
import { toYYYYMMDD } from "../tools/dates/date-functions";

import { ClocDiffCommitEnriched, ClocDiffCommitEnrichedWithDerivedData, ClocDiffWithCommitOptions } from "./cloc-diff-commit.model";
import { defaultBranchName$ } from "../git-functions/branches";

//********************************************************************************************************************** */
//****************************   Module objectives                               *************************************** */
//********************************************************************************************************************** */
/** 
 * cloc-diff-commit contain functions which calculate the differences between the commits in a given time range.
 * This is achieved by mixing cloc and git commands.
 * cloc and git commands are executed using the `child_process` module. Therefore the communicate asynchronously with the main thread.
 * For this reason, the functions in this module use the rxJs library and return Observables.
 * 
 * The core function of this module is clocDiffWithCommit$. 
 * It takes a path to a Git repository folder and returns an Observable of ClocDiffCommitEnriched objects,
 * each containing the differences for a file that has changed in a single commit when compared to its parent commit.
 * All the commits in the given time range are considered.
 * 
 * The functions of this module are used to calculate the code-turnover, i.e. the sum of the lines of code added, removed and modified,
 * for each file in each commit in the period of time considered.
 * code-turnover can be calculated either on a single repo or on all the repos which are in a given folder.
 * 
 * There are also functions that can write the records calculated by the functions of this module to a CSV file for further analysis.
 * 
**/

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Calculates the differences between the commits in a given time range (the comparison is performed with the parent commit of each commit),
 * enriched with the data retrieved using cloc (like lines of code, comments and blanks) as well as the data of the commit itself 
 * (like author, date, message, etc.).
 * The function returns an Observable of ClocDiffCommitEnrichedWithDerivedData objects.
 * Each ClocDiffCommitEnrichedWithDerivedData represents the changes that one file has undergone in a single commit 
 * when compared to its parent commit.
 * All the commits in the given time range are considered and all the files changed in each commit are considered.
 * For instance, if in the time range there have been 10 commits and each commit has changed 5 files, then
 * the function will return an Observable representing a stream emitting 50 ClocDiffCommitEnrichedWithDerivedData objects.
 * 
 * The core steps are the following
 * 1. calculate the cloc dictionary for the repository using the "cloc" command - this dictionary contains the info about 
 * the lines of code, comments and blanks for each file in the current state of the repository 
 * (i.e. the folder of the repo and all its subfolders)
 * 2. read the commits in the given time range - this data is retrieved using the "git log" command and then enriched with the
 * url of the repository (obtained with the "git config --get remote.origin.url") and the date of the parent commit 
 * (obtained again with the "git log" command applied only to the parent commit)
 * 3. calculate the differences for each file that has changed in each commit when compared to its parent commit - this data is
 * retrieved using the "cloc --git-diff-rel --by-file" command and then enriched with the data from 
 * the cloc dictionary and the commit data - we also call the "git diff --numstat" command to retrieve which files are considered
 * to be copy or rename of other files (this info is not returned by the "cloc" command) and we use it to mark wheter a file
 * is a copy or rename of another file
 * 4. calculate the derived data - for instance we calculate the code turnover for each file change, where the code-tunover is the 
 * sum of the lines of code added, removed and modified
 * 
 * @param pathToRepo The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable of ClocDiffCommitEnriched objects.
 */
export function clocDiffWithAllCommits$(
    pathToRepo: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    options: ClocDiffWithCommitOptions = { filePrefix: 'cloc-diff-all-commits' },
    progress: {
        totNumOfCommits: number,
        commitCounter: number,
        errorCounter: number,
    } = {
            totNumOfCommits: 0,
            commitCounter: 0,
            errorCounter: 0,
        }
) {
    const languages = options.languages || []
    // first calculate the cloc dictionary and pass it down the pipe
    return clocFileDict$(pathToRepo, languages, options).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`!!!!!!!! folder ${pathToRepo} not found`);
                process.exit(1);
            }
            throw err;
        }),
        // then read the commits in the given time range and pass them down the pipe together with the cloc dictionary
        concatMap((clocFileDict) => {
            return defaultBranchName$(pathToRepo, options).pipe(
                concatMap(branchName => {
                    return readCommitCompactWithUrlAndParentDate$(pathToRepo, fromDate, toDate, true, branchName, options)
                }),
                map((commit) => {
                    return { commit, clocFileDict }
                }),
                catchError(err => {
                    console.error(`Error: "clocDiffWithAllCommits$" while reading commits from repo "${pathToRepo}"`)
                    console.error(`error message ${err.message}`)
                    return EMPTY
                })
            )
        }),
        // then calculate the cloc diff for each commit (against its parent) and pass it down the pipe 
        // together with the cloc dictionary and the commit
        concatMap(({ commit, clocFileDict }) => {
            return clocDiffWithParentByfile$(commit.sha, pathToRepo, languages, options.notMatchDirectories, options, progress).pipe(
                map((clocDiffByfile) => {
                    return { clocDiffByfile, clocFileDict, commit }
                })
            )
        }),
        // now enrich the cloc diff with the cloc dictionary and the commit data
        map(({ clocDiffByfile, clocFileDict, commit }) => {
            let clocInfo: ClocFileInfo = clocFileDict[clocDiffByfile.file]
            if (!clocInfo) {
                clocInfo = {
                    code: 0,
                    comment: 0,
                    blank: 0,
                    language: '',
                    file: clocDiffByfile.file
                }
            }
            const clocDiffCommitEnriched: ClocDiffCommitEnriched = {
                ...clocDiffByfile,
                ...clocInfo,
                ...commit
            }
            // set the file path relative to the current working directory to make it easier to read and possibly to link
            clocDiffCommitEnriched.file = path.relative(process.cwd(), clocDiffCommitEnriched.file)
            // calculate the derived data
            const clocDiffCommitEnrichedWithDerivedData = calculateDerivedData(clocDiffCommitEnriched, options, pathToRepo)

            return clocDiffCommitEnrichedWithDerivedData
        }),
    )
}

/**
 * Calculates the cloc diff for each commit in each Git repository in a given folder between two dates, 
 * considering only the files of languages that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffCommitEnriched.
 * Repos whose path is in the set of excluded repo paths are ignored.
 * The changes that affect files that are not in the set of languages are ignored.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param excludeRepoPaths An array of repository paths to exclude. Wildcards can be used. Defaults to an empty array.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffCommitEnriched.
 */
export function clocDiffWithCommitForRepos$(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    excludeRepoPaths: string[] = [],
    options: ClocDiffWithCommitOptions = { 'filePrefix': 'cloc-diff-commit-for-repos' }
) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    const creationDateCsvFilePath = options.creationDateCsvFilePath

    return countCommits$(repoPaths, fromDate, toDate, creationDateCsvFilePath).pipe(
        concatMap((totNumOfCommits) => {
            const progess = {
                totNumOfCommits,
                commitCounter: 0,
                errorCounter: 0,
            }
            return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe(
                concatMap(({ repoPath, _fromDate }) => {
                    return clocDiffWithAllCommits$(repoPath, _fromDate, toDate, options, progess)
                })
            )
        })
    )
}

/**
 * Writes the cloc diff information, enriched with lines of code data and commit data, for a Git repository to a CSV file.
 * The file name is derived from the repository name, the start date, and the end date.
 * Returns an Observable that notifies the name of the file where the cloc diff info is saved once the cloc command execution is finished.
 * @param pathToRepo The path to the Git repository folder.
 * @param outDir The path to the folder where the output file should be saved. Defaults to the current directory.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable that emits the name of the file where the cloc diff info is saved.
 */
export function writeClocDiffWithCommit$(
    pathToRepo: string,
    outDir = './',
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    languages: string[] = []
) {
    const pathToRepoName = path.basename(pathToRepo);
    const outFile = `${pathToRepoName}-cloc-diff-commit-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    const options = { languages, filePrefix: 'cloc-diff-commit' }

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffWithAllCommits$(pathToRepo, fromDate, toDate, options)),
        toCsvObs(),
        concatMap((line) => {
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                console.log(`====>>>> cloc-diff-commit info saved on file ${outFilePath}`);
            },
        }),
    )
}

/**
 * Writes the cloc diff for each file in each commit in each Git repository in a given folder between two dates to a CSV file.
 * Repos whose path is in the set of excluded repo paths are ignored.
 * The changes that affect files that are not in the set of languages are ignored.
 * The resulting CSV file is saved in the directory specified by the `outdir` option, or in the current directory 
 * if no `outdir` is specified.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param options An object containing options for the function. The options are:
 *   - `outdir`: The directory where the resulting CSV file should be saved. Defaults to the current directory.
 *   - `fromDate`: The start date of the time range. Defaults to the beginning of time.
 *   - `toDate`: The end date of the time range. Defaults to the current date and time.
 *   - `excludeRepoPaths`: An array of repository paths to exclude. Wildcards can be used. Defaults to an empty array.
 *   - `languages`: An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable that emits the path of the resulting CSV file.
 */
export function writeCodeTurnover$(
    folderPath: string,
    options: WriteCodeTurnoverOptions = { filePrefix: 'code-turnover' }
) {
    const outDir = options.outdir || './'
    const fromDate = options.fromDate || new Date(0)
    const toDate = options.toDate || new Date(Date.now())
    const excludeRepoPaths: string[] = options.excludeRepoPaths || []

    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-code-turnover-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    let noCommitsFound = true;

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => {
            return clocDiffWithCommitForRepos$(folderPath, fromDate, toDate, excludeRepoPaths, options)
        }),
        map(clocDiffCommitEnriched => {
            const csvRec = formatCodeTurnoverForCsv(clocDiffCommitEnriched, options)
            return csvRec
        }),
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
                console.log(`\n====>>>> code-turnover info saved on file ${outFilePath}`);
            },
        }),
    )
}
export type WriteCodeTurnoverOptions = {
    outdir?: string,
    fromDate?: Date,
    toDate?: Date,
    excludeRepoPaths?: string[],
    languages?: string[],
    removeBlanks?: boolean,
    removeComments?: boolean,
    removeSame?: boolean,
} & ClocDiffWithCommitOptions


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function calculateDerivedData(clocDiffCommitEnriched: ClocDiffCommitEnriched, options: ClocDiffWithCommitOptions, repoPath: string) {
    const _module = path.dirname(clocDiffCommitEnriched.file);
    // remove the starting repoPath from the _module path
    const module = _module.substring(repoPath.length + 1);

    const date_month = clocDiffCommitEnriched.date.toISOString().slice(0, 7);

    const commit_code_turnover =
        clocDiffCommitEnriched.commit_code_added +
        clocDiffCommitEnriched.commit_code_removed +
        clocDiffCommitEnriched.commit_code_modified;
    const file_code_turnover =
        clocDiffCommitEnriched.code_added +
        clocDiffCommitEnriched.code_removed +
        clocDiffCommitEnriched.code_modified;
    const commit_code_turnover_no_removed_lines =
        clocDiffCommitEnriched.commit_code_added +
        clocDiffCommitEnriched.commit_code_modified;
    const file_code_turnover_no_removed_lines =
        clocDiffCommitEnriched.code_added +
        clocDiffCommitEnriched.code_modified;

    // days_span is an integer number with no decimals that represents the number of days between the commit date 
    // and the parent commit date
    const days_span = Math.floor((
        clocDiffCommitEnriched.date.getTime() - clocDiffCommitEnriched.parentDate.getTime()
    ) / (1000 * 60 * 60 * 24))

    let _maybe_mass_refact = false
    let _explain_mass_refact = ''
    if (options.fileMassiveRefactorThreshold || options.commitMassiveRefactorThreshold) {
        const { maybe_mass_refact, explain_mass_refact } = isPossibleMassiveRefactor(
            file_code_turnover,
            commit_code_turnover,
            options.fileMassiveRefactorThreshold || -1,
            options.commitMassiveRefactorThreshold || -1,
        )
        _maybe_mass_refact = maybe_mass_refact
        _explain_mass_refact = explain_mass_refact
    }

    const { maybe_generated, explain_generated } = isPossibleGenerated(clocDiffCommitEnriched)

    const massive_remove = isMassiveRemove(clocDiffCommitEnriched, options.commitMassiveRemoveThreshold || 0.9)

    const jiraId = extractJiraId(clocDiffCommitEnriched, options)

    const infoWithDerivedData: ClocDiffCommitEnrichedWithDerivedData = {
        ...clocDiffCommitEnriched,
        module,
        year_month: date_month,
        commit_code_turnover,
        file_code_turnover,
        commit_code_turnover_no_removed_lines,
        file_code_turnover_no_removed_lines,
        days_span,
        maybe_mass_refact: _maybe_mass_refact,
        explain_mass_refact: _explain_mass_refact,
        maybe_generated,
        explain_generated,
        massive_remove,
        jira_id: jiraId,
    }
    return infoWithDerivedData
}

// isPossibleMassiveRefactor is a function that returns true if the commit is a possible massive refactor
// a file diff is a possible massive refactor if the file_code_turnover is greater than a given threshold
// or if the commit_code_turnover is greater than a given threshold
function isPossibleMassiveRefactor(
    file_code_turnover: number,
    commit_code_turnover: number,
    fileMassiveRefactorThreshold: number,
    commitMassiveRefactorThreshold: number) {
    const file_turnover_above = file_code_turnover > fileMassiveRefactorThreshold
    const commit_turnover_above = commit_code_turnover > commitMassiveRefactorThreshold
    const maybe_mass_refact = file_turnover_above || commit_turnover_above
    let explain_mass_refact = ''
    explain_mass_refact = file_turnover_above ? `file turnover above threshold (${file_code_turnover} > ${fileMassiveRefactorThreshold})` : ''
    explain_mass_refact = commit_turnover_above ? `commit turnover above threshold (${commit_code_turnover} > ${commitMassiveRefactorThreshold})` : ''
    explain_mass_refact = file_turnover_above && commit_turnover_above ?
        'both file and commit turnover above threshold' :
        explain_mass_refact
    explain_mass_refact = explain_mass_refact == '' ? '-' : explain_mass_refact
    return { maybe_mass_refact, explain_mass_refact }
}

// isPossibleGenerated is a function that returns true if the commit is a possible generated file
// a file diff is a possible generated file if the file name contains the string 'generated'
// or if the commit subject contains the string 'generated'
function isPossibleGenerated(clocDiffCommitEnriched: ClocDiffCommitEnriched) {
    const file_generated = clocDiffCommitEnriched.file.toLowerCase().includes('generated')
    const commit_generated = clocDiffCommitEnriched.subject.toLowerCase().includes('generated')
    const maybe_generated = file_generated || commit_generated
    let explain_generated = ''
    explain_generated = file_generated ? 'file name contains "generated"' : ''
    explain_generated = commit_generated ? 'commit message contains "generated"' : ''
    explain_generated = file_generated && commit_generated ?
        'both file name and commit message contain "generated"' :
        explain_generated
    explain_generated = explain_generated == '' ? '-' : explain_generated
    return { maybe_generated, explain_generated }
}

// returns true if the vast majority of the changes in the commit are removals
function isMassiveRemove(csvRec: ClocDiffCommitEnriched, massiveRemovalThreshold: number) {
    const commitRemovedLines = csvRec.commit_code_removed
    const commitCodeTurnover = csvRec.commit_code_added + csvRec.commit_code_removed + csvRec.commit_code_modified
    return commitRemovedLines / commitCodeTurnover > massiveRemovalThreshold
}

// extract the Jira ID from the commit subject using the jiraIdExtractor function if it is specified
// otherwise use the jiraIdRegexPattern to extract the Jira ID from the commit subject if it is specified
// otherwise return '-'
function extractJiraId(clocDiffCommitEnriched: ClocDiffCommitEnriched, options: ClocDiffWithCommitOptions) {
    if (options.jiraIdExtractor) {
        return options.jiraIdExtractor(clocDiffCommitEnriched) || '-'
    }
    if (options.jiraIdRegexPattern?.trim()) {
        // use a regular expression to extract the Jira ID from the commit subject
        // const regex = new RegExp(options.jiraIdRegexPattern)
        const jiraId = clocDiffCommitEnriched.subject.match(options.jiraIdRegexPattern)?.[0]
        return jiraId || '-'
    }
    return '-'
}

function formatCodeTurnoverForCsv(csvRec: ClocDiffCommitEnriched, options: WriteCodeTurnoverOptions) {
    // define csvRecObj as of type any so that we can manipulate its properties without type checking
    // while we keep the type checking for csvRec so that we know which are the properties available
    const csvRecObj: any = csvRec
    // delete the object containing the sum of the diffs (all data are stored in simple properties of csvRec)
    delete csvRecObj.sumOfDiffs
    // format the dates to YYYY-MM-DD
    csvRecObj.date = toYYYYMMDD(csvRec.date)
    csvRecObj.parentDate = toYYYYMMDD(csvRec.parentDate)

    const removeBlanks = options.removeBlanks || false
    const removeComments = options.removeComments || false
    const removeSame = options.removeSame || false
    if (removeBlanks) {
        delete csvRecObj.blank_added
        delete csvRecObj.blank_modified
        delete csvRecObj.blank_removed
        delete csvRecObj.blank_same
        delete csvRecObj.blank
    }
    if (removeComments) {
        delete csvRecObj.comment_added
        delete csvRecObj.comment_modified
        delete csvRecObj.comment_removed
        delete csvRecObj.comment_same
        delete csvRecObj.comment
    }
    if (removeSame) {
        delete csvRecObj.blank_same
        delete csvRecObj.comment_same
        delete csvRecObj.code_same
    }

    return csvRecObj
}