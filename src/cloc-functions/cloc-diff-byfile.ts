import { catchError, concatMap, filter, from, map, of, skip, tap, toArray } from "rxjs";
import { executeCommandObs } from "../tools/execute-command/execute-command";
import { ignoreUpTo } from "../tools/rxjs-operators/ignore-up-to";
import { CLOC_CONFIG } from "./config";
import { ClocDiffByfileWithSumAndIsCopy, newClocDiffByfile, newClocDiffByfileWithCommitData, newClocDiffByfileWithSum } from "./cloc-diff-byfile.model";
import { copyRenamesDict$ } from "../git-functions/diff-file";

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
    progress: {
        totNumOfCommits: number,
        commitCounter: number,
        errorCounter: number,
    } = {
            totNumOfCommits: 0,
            commitCounter: 0,
            errorCounter: 0,
        },
) {
    return executeClocGitDiffRel$(mostRecentCommit, leastRecentCommit, repoFolderPath, languages).pipe(
        tap({
            next: (lines) => {
                // log progress
                if (lines[0] === 'Nothing to count.') {
                    progress.errorCounter++
                }
                progress.commitCounter++
                const ofMsg = progress.totNumOfCommits == 0 ? '' : `of ${progress.totNumOfCommits} commits - nothing to count: ${progress.errorCounter} `
                console.log(`commit ${progress.commitCounter} ${ofMsg}`)
            }
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
        // read the differences returned by the git diff command using the diff$ function
        // these difference mark the files that have been copied or renamed
        // we use this info to mark as copyRename the files that have been copied or renamed
        // we continue to use the cloc --git-diff-rel command since this gives us the info about the lines of code, comments, and blanks
        // as well as the info about which lines have been modified and therefore it is more useful to calculate
        // the code turnover.
        // At the same time, marking the diffs which are copies improves the accuracy of the code turnover calculation because
        // we may decide to filter such diffs when we run the analysis
        concatMap(arrayOfClocDiffByfile => {
            return copyRenamesDict$(mostRecentCommit, leastRecentCommit, repoFolderPath).pipe(
                map(copyRenameDict => {
                    const addDataWithCopyInfo = arrayOfClocDiffByfile.map((diff) => {
                        const diffWithIsCopy: ClocDiffByfileWithSumAndIsCopy = { ...diff, isCopy: false }
                        if (copyRenameDict[diff.file]) {
                            diffWithIsCopy.isCopy = true;
                        }
                        return diffWithIsCopy;
                    })
                    return addDataWithCopyInfo
                }),
            )
        }),
    )
        // we need to concatenate 2 pipes since "pipe" TypeScript overrides are define so that "pipe" can take at most 9 operators
        // and when we add a 10th operator, the compiler makes "pipe" return Observable<unknown> instead of Observable<whateverType>
        // and with Observable<unknown> the downstream operators do not compile.
        // Since the above "pipe" has reached the limit of 9 operators, we cannot add the "concatMap" operator to it.
        // Therefore, to make type inference work, we need to concatenate 2 pipes
        .pipe(
            // after having calculated the sum and set it to each diff object, stream again the array of diffs
            concatMap(arrayOfClocDiffByfile => {
                return from(arrayOfClocDiffByfile)
            }),
        ).pipe()
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
export function clocDiffByfileWithCommitData$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    languages: string[] = [],
    progress: {
        totNumOfCommits: number,
        commitCounter: number,
        errorCounter: number,
    } = {
            totNumOfCommits: 0,
            commitCounter: 0,
            errorCounter: 0,
        },
) {
    return clocDiffByfile$(mostRecentCommit, leastRecentCommit, repoFolderPath, languages, progress).pipe(
        // and then map each ClocDiffByfile object to a ClocDiffByfileWithCommitDiffs object
        map(clocDiffByfile => {
            return newClocDiffByfileWithCommitData(clocDiffByfile)
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
    progress: {
        totNumOfCommits: number,
        commitCounter: number,
        errorCounter: number,
    } = {
            totNumOfCommits: 0,
            commitCounter: 0,
            errorCounter: 0,
        },
) {
    return clocDiffByfileWithCommitData$(commit, `${commit}^1`, repoFolderPath, languages, progress);
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
    let clocDiffAllCommand = `cloc --git-diff-rel --csv --by-file --timeout=${CLOC_CONFIG.TIMEOUT} --quiet`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}

function executeClocGitDiffRel$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath: string,
    languages: string[] = [],
) {
    const cmd = buildClocDiffRelByFileCommand(mostRecentCommit, leastRecentCommit, languages, repoFolderPath);

    return executeCommandObs('run cloc --git-diff-rel --by-file --quiet', cmd).pipe(
        map((output) => {
            return output.split('\n');
        }),
        catchError((err) => {
            // we have encountered situations where cloc returns an error with a message containing text like this:
            // "did not match any files\nFailed to create tarfile of files from git".
            // In this case the error code is 25.
            // We do not want to stop the execution of the script, so we just log the error and return an empty array.
            if (err.code === 25) {
                console.warn(`Non fatal Error executing command ${cmd}`, err.message);
                const emptyArray: string[] = [];
                return of(emptyArray)
            }
            throw err;
        }),
    )
}