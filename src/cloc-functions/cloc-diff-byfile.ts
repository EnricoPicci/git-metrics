import { concatMap, filter, from, map, skip, toArray } from "rxjs";
import { executeCommandObs } from "../tools/execute-command/execute-command";
import { ignoreUpTo } from "../tools/rxjs-operators/ignore-up-to";
import { CLOC_CONFIG } from "./config";
import { newClocDiffByfile, newClocDiffByfileWithCommitDiffs, newClocDiffByfileWithSum } from "./cloc-diff-byfile.model";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Calculates the cloc diff for each file in a Git repository between two commits, considering only the files 
 * of languages that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffByfile.
 * @param mostRecentCommit The hash of the most recent commit.
 * @param leastRecentCommit The hash of the least recent commit.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffByfile.
 */
export function clocDiffByfile$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    languages: string[] = [],
) {
    const cmd = buildClocDiffRelByFileCommand(mostRecentCommit, leastRecentCommit, languages, repoFolderPath);

    return executeCommandObs('run cloc --git-diff-rel --by-file', cmd).pipe(
        map((output) => {
            return output.split('\n');
        }),
        concatMap(lines => {
            return from(lines)
        }),
        ignoreUpTo(CLOC_DIFF_BYFILE_HEADER),
        // skip the header line
        skip(1),
        filter(line => line.length > 0),
        map(line => {
            return newClocDiffByfileWithSum(line)
        }),
        // cumulate all the values into an array, then calculate the sum of each property
        // and set it to the sumOfDiffs property of each diff object
        toArray(),
        map(arrayOfClocDiffByfile => {
            const sumOfClocDiffByfile = arrayOfClocDiffByfile.reduce((acc, clocDiffByfile) => {
                acc.code_added += clocDiffByfile.code_added;
                acc.code_modified += clocDiffByfile.code_modified;
                acc.code_removed += clocDiffByfile.code_removed;
                acc.code_same += clocDiffByfile.code_same;
                acc.blank_added += clocDiffByfile.blank_added;
                acc.blank_modified += clocDiffByfile.blank_modified;
                acc.blank_removed += clocDiffByfile.blank_removed;
                acc.blank_same += clocDiffByfile.blank_same;
                acc.comment_added += clocDiffByfile.comment_added;
                acc.comment_modified += clocDiffByfile.comment_modified;
                acc.comment_removed += clocDiffByfile.comment_removed;
                acc.comment_same += clocDiffByfile.comment_same;
                return acc;
            }, newClocDiffByfile(''));
            sumOfClocDiffByfile.file = 'Sum of all files in the diff for the commit ' + mostRecentCommit;
            sumOfClocDiffByfile.file = sumOfClocDiffByfile.file + ' compared to ' + leastRecentCommit;
            for (const diff of arrayOfClocDiffByfile) {
                diff.sumOfDiffs = sumOfClocDiffByfile;
            }
            return arrayOfClocDiffByfile;
        }),
        // after having calculated the sum and set it to each diff object, stream again the array of diffs
        concatMap(arrayOfClocDiffByfile => {
            return from(arrayOfClocDiffByfile)
        }),
    )
}

/**
 * Calculates the cloc diff for each file in a Git repository between two commits, considering only the files of languages 
 * that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffByfileWithCommitDiffs.
 * @param mostRecentCommit The hash of the most recent commit.
 * @param leastRecentCommit The hash of the least recent commit.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffByfileWithCommitDiffs.
 */
export function clocDiffByfileWithCommitDiffs$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    languages: string[] = []
) {
    return clocDiffByfile$(mostRecentCommit, leastRecentCommit, repoFolderPath, languages).pipe(
        // and then map each ClocDiffByfile object to a ClocDiffByfileWithCommitDiffs object
        map(clocDiffByfile => {
            return newClocDiffByfileWithCommitDiffs(clocDiffByfile)
        }),
    )
}

/**
 * Calculates the cloc diff for each file in a Git repository between a commit and its parent, 
 * considering only the files of languages that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffByfile.
 * @param commit The hash of the commit to calculate the cloc diff for.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffByfileWithCommitDiffs.
 */
export function clocDiffWithParentByfile$(
    commit: string,
    repoFolderPath = './',
    languages: string[] = [],
) {
    return clocDiffByfileWithCommitDiffs$(commit, `${commit}^1`, repoFolderPath, languages);
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export const CLOC_DIFF_BYFILE_HEADER = 'File, == blank, != blank, + blank, - blank, == comment, != comment, + comment, - comment, == code, != code, + code, - code,'

function buildClocDiffRelByFileCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './',
) {
    const cdCommand = `cd ${folderPath}`;
    let clocDiffAllCommand = `cloc --git-diff-rel --csv --by-file --timeout=${CLOC_CONFIG.TIMEOUT}`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}