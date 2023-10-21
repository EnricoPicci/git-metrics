import path from "path";

import { catchError, concatMap, defaultIfEmpty, from, ignoreElements, map, tap } from "rxjs";

import { appendFileObs } from "observable-fs";
import { toCsvObs } from "@enrico.piccinin/csv-tools";

import { clocFileDict$ } from "../cloc-functions/cloc-dictionary";
import { clocDiffWithParentByfile$ } from "../cloc-functions/cloc-diff-byfile";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { readCommitCompactWithUrlAndParentDate$ } from "../git-functions/commit";

import { ClocDiffCommitEnriched, ClocDiffCommitEnrichedWithDerivedData } from "./cloc-diff-commit.model";
import { gitRepoPaths } from "../git-functions/repo-path";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils";
import { toYYYYMMDD } from "../tools/dates/date-functions";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


/**
 * Calculates the differences between the commits in a given time range (the comparison is performed with the parent commit of each commit),
 * enriched with the data retrieved using cloc (like lines of code, comments and blanks) as well as the data of the commit itself 
 * (like author, date, message, etc.).
 * The function returns an Observable of ClocDiffCommitEnriched objects, each containing the differences for all the files 
 * that have changed in the single commit when compared to its parent commit.
 * @param pathToRepo The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable of ClocDiffCommitEnriched objects.
 */
export function clocDiffWithCommit$(
    pathToRepo: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    languages: string[] = [],
    options: ClocDiffWithCommitOptions = {}
) {
    // first calculate the cloc dictionary and pass it down the pipe
    return clocFileDict$(pathToRepo).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`!!!!!!!! folder ${pathToRepo} not found`);
                process.exit(1);
            }
            throw err;
        }),
        // then read the commits in the given time range and pass them down the pipe together with the cloc dictionary
        concatMap((clocFileDict) => {
            return readCommitCompactWithUrlAndParentDate$(pathToRepo, fromDate, toDate).pipe(
                map((commit) => {
                    return { commit, clocFileDict }
                })
            )
        }),
        // then calculate the cloc diff for each commit (against its parent) and pass it down the pipe 
        // together with the cloc dictionary and the commit
        concatMap(({ commit, clocFileDict }) => {
            return clocDiffWithParentByfile$(commit.sha, pathToRepo, languages).pipe(
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
            clocDiffCommitEnriched.file = path.join(pathToRepo, clocDiffCommitEnriched.file)
            clocDiffCommitEnriched.file = path.relative(process.cwd(), clocDiffCommitEnriched.file)
            // calculate the derived data
            const clocDiffCommitEnrichedWithDerivedData = calculateDerivedData(clocDiffCommitEnriched, options)

            return clocDiffCommitEnrichedWithDerivedData
        }),
    )
}
export type ClocDiffWithCommitOptions = {
    fileMassiveRefactorThreshold?: number,
    commitMassiveRefactorThreshold?: number,
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
    languages: string[] = [],
    options: ClocDiffWithCommitOptions = {}
) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    return from(repoPaths).pipe(
        concatMap((repoPath) => {
            return clocDiffWithCommit$(repoPath, fromDate, toDate, languages, options)
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

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffWithCommit$(pathToRepo, fromDate, toDate, languages)),
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
export function writeClocDiffWithCommitForRepos$(
    folderPath: string,
    options: WriteClocDiffWithCommitForReposOptions = {}
) {
    const outDir = options.outdir || './'
    const fromDate = options.fromDate || new Date(0)
    const toDate = options.toDate || new Date(Date.now())
    const excludeRepoPaths: string[] = options.excludeRepoPaths || []
    const languages: string[] = options.languages || []

    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-commit-${toYYYYMMDD(fromDate)}-${toYYYYMMDD(toDate)}.csv`;
    const outFilePath = path.join(outDir, outFile);

    let noCommitsFound = true;

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffWithCommitForRepos$(folderPath, fromDate, toDate, excludeRepoPaths, languages, options)),
        map(clocDiffCommitEnriched => {
            const csvRec = formatClocDiffCommitEnrichedForCsv(clocDiffCommitEnriched, options)
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
                    console.log(`====>>>> no commits found in the given time range, for the given languages, in the given repos`);
                    return;
                }
                console.log(`====>>>> cloc-diff-commit-for-repos info saved on file ${outFilePath}`);
            },
        }),
    )
}
export type WriteClocDiffWithCommitForReposOptions = {
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

function calculateDerivedData(clocDiffCommitEnriched: ClocDiffCommitEnriched, options: ClocDiffWithCommitOptions) {
    const commit_code_turnover =
        clocDiffCommitEnriched.commit_code_added +
        clocDiffCommitEnriched.commit_code_removed +
        clocDiffCommitEnriched.commit_code_modified;

    const file_code_turnover =
        clocDiffCommitEnriched.code_added +
        clocDiffCommitEnriched.code_removed +
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

    const infoWithDerivedData: ClocDiffCommitEnrichedWithDerivedData = {
        ...clocDiffCommitEnriched,
        commit_code_turnover,
        file_code_turnover,
        days_span,
        maybe_mass_refact: _maybe_mass_refact,
        explain_mass_refact: _explain_mass_refact,
        maybe_generated,
        explain_generated,
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


function formatClocDiffCommitEnrichedForCsv(csvRec: ClocDiffCommitEnriched, options: WriteClocDiffWithCommitForReposOptions) {// define csvRecObj as of type any so that we can manipulate its properties without type checking
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