import path from "path";

import { catchError, concatMap, defaultIfEmpty, from, ignoreElements, map, tap } from "rxjs";

import { appendFileObs } from "observable-fs";
import { toCsvObs } from "@enrico.piccinin/csv-tools";

import { clocFileDict$ } from "../cloc-functions/cloc-dictionary";
import { clocDiffWithParentByfile$ } from "../cloc-functions/cloc-diff-byfile";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { readCommitCompactWithParentDate$ } from "../git-functions/commit";

import { ClocDiffCommitEnriched } from "./cloc-diff-commit.model";
import { gitRepoPaths } from "../git-functions/repo-path.functions";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";
import { createDirIfNotExisting } from "../tools/fs-utils/fs-utils";

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
    languages: string[] = []
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
            return readCommitCompactWithParentDate$(pathToRepo, fromDate, toDate).pipe(
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
            clocDiffCommitEnriched.possibleCutPaste = isPossibleCutPaste(clocDiffCommitEnriched)
            return clocDiffCommitEnriched
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
    languages: string[] = []
) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    return from(repoPaths).pipe(
        concatMap((repoPath) => {
            return clocDiffWithCommit$(repoPath, fromDate, toDate, languages)
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
    const outFile = `${pathToRepoName}-cloc-diff-commit-${fromDate.toISOString().split('T')[0]}-${toDate.toISOString().split('T')[0]}.csv`;
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

export function writeClocDiffWithCommitForRepos$(
    folderPath: string,
    outDir = './',
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    excludeRepoPaths: string[] = [],
    languages: string[] = []
) {
    const folderName = path.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-commit-${fromDate.toISOString().split('T')[0]}-${toDate.toISOString().split('T')[0]}.csv`;
    const outFilePath = path.join(outDir, outFile);

    let noCommitsFound = true;

    createDirIfNotExisting(outDir);

    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocDiffWithCommitForRepos$(folderPath, fromDate, toDate, excludeRepoPaths, languages)),
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


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

// the change is a possible cut and paste if the number of lines of code added is equal to the number of lines removed
// and the number of lines added is greater than 0 (which means that there are lines of code added and removed) 
// and the number of lines modified is 0
function isPossibleCutPaste(clocDiffCommitEnriched: ClocDiffCommitEnriched) {
    return clocDiffCommitEnriched.code_added === clocDiffCommitEnriched.code_removed &&
        clocDiffCommitEnriched.code_added > 0 &&
        clocDiffCommitEnriched.code_modified === 0
}