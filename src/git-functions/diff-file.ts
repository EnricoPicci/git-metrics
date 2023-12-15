import { catchError, map, } from "rxjs";
import { executeCommandObs } from "../tools/execute-command/execute-command";
import { GitDiffFileDict } from "./diff-file.model";
import { isUnknownRevisionError } from "./errors";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Returns an Observable that emits an array of GitDiff objects representing the differences between two Git commits in a given repository.
 * Details about the differences are calculated using the `git diff` command 
 * can be read here https://git-scm.com/docs/git-diff#_other_diff_formats.
 * @param mostRecentCommit The SHA of the most recent commit.
 * @param leastRecentCommit The SHA of the least recent commit.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param similarityIndex The similarity index to use for rename detection. Defaults to 50.
 * @returns An Observable that emits an array of GitDiff objects representing the differences between the two Git commits.
 */
export function diff$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    similarityIndex = 50,
) {
    const cmd = buildDiffCommand(mostRecentCommit, leastRecentCommit, repoFolderPath, similarityIndex);
    return executeCommandObs('run git diff', cmd).pipe(
        catchError((error) => {
            if (isUnknownRevisionError(error)) {
                console.warn(`Error in fetchOneCommit for repo "${repoFolderPath} and commit ${mostRecentCommit}"`)
                return [];
            }
            if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
                console.warn(`ERR_CHILD_PROCESS_STDIO_MAXBUFFER Error executing command ${cmd}`, error.message);
                return []
            }
            const err = `Error in fetchOneCommit for repo "${repoFolderPath} and commit ${mostRecentCommit}"\nError: ${error}
Command: ${cmd}`;
            // in case of error we return an error
            throw new Error(err);
        }),
        map((output) => {
            const tokens = output.split('\0').filter((token) => token.length > 0);
            if (tokens.length === 0) {
                console.log(`No files changed between ${mostRecentCommit} and ${leastRecentCommit}`);
                return [];
            }

            const diffs = splitDiffs(tokens);
            return diffs;
        })
    );
}

/**
 * Calculates the git diff between two commits and returns an Observable that emits one object of type GitDiffFileDict,
 * where the keys are the file paths which represents copy or renames and the values are the GitDiffFile objects representing 
 * the copy or rename.
 * @param mostRecentCommit The SHA of the most recent commit.
 * @param leastRecentCommit The SHA of the least recent commit.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param similarityIndex The similarity index to use for rename detection. Defaults to 50.
 * @returns An Observable that emits one object of type GitDiffFileDict representing the copy or rename operations between the two Git commits.
 */
export function copyRenamesDict$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    similarityIndex = 50,
) {
    return diff$(mostRecentCommit, leastRecentCommit, repoFolderPath, similarityIndex).pipe(
        map((diffs) => {
            const copyRenamesDict: GitDiffFileDict = {};
            for (const diff of diffs) {
                if (diff.isRenameCopy) {
                    copyRenamesDict[diff.filePath] = diff;
                    copyRenamesDict[diff.preImagePath] = diff;
                }
            }
            return copyRenamesDict;
        })
    );
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function buildDiffCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    folderPath: string,
    similarityIndex: number
) {
    const cdCommand = `cd ${folderPath}`;
    let clocDiffAllCommand = `git diff --numstat -M${similarityIndex}% -z ${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} `;
}

export function splitDiffs(tokens: string[]) {
    const diffs: {
        linesAdded: number,
        linesDeleted: number,
        filePath: string,
        preImagePath: string,
        isRenameCopy: boolean,
    }[] = [];

    for (let i = 0; i < tokens.length; i++) {
        // diffs come as either 1 or 3 tuples of tokens
        // If a diff does NOT represent a rename or copy, then we have 1 token
        // If a diff represents a rename or copy, then we have 3 tokens
        // Example of a diff that does NOT represent a rename or copy:
        // '69\t69\tdist/apps/code-turnover/internals/commit-monthly-pair.functions.spec.js',
        // Example of a diff that represents a rename or copy:
        // '0\t0\t',
        // 'src/config-copy-copy-xx.ts',
        // 'src/config-copy-xx.ts',
        //
        // To understand if it is a rename/copy situation, we need to check how the token[i] can be split with \t
        // If it can be split in 3 parts and the third part is not the empty line, then we have NOT a rename/copy situation
        // and the 3 parts represent lines added, lines deleted, and file path (which we call preImagePath).
        // If it can be split in 3 parts and the third part is the empty line, then we have a rename/copy situation and the 2 non empty
        // parts represent lines added and lines deleted - in this case the token[i+1] represents the preImage file path and 
        // the token[i+2] represents the postImage file path.
        // If token[i] cannot be split in 3 parts, then we have an error
        const thisToken = tokens[i];
        const thisTokenParts = thisToken.split('\t');
        if (thisTokenParts.length !== 3) {
            throw new Error(`Error parsing git diff output for token: ${thisToken}
                    we expect 3 values containing lines added, lines deleted, and file path (in case on no rename/copy)
                    or an empty string (in case of rename/copy)
                    as per documentation https://git-scm.com/docs/git-diff#_other_diff_formats`);
        }
        const isRenameCopy = thisTokenParts[2].length === 0;

        // in all cases the first 2 parts of thisTokenParts contain the lines added and deleted
        const linesAdded = parseInt(thisTokenParts[0]);
        const linesDeleted = parseInt(thisTokenParts[1]);

        // in case of a rename/copy the preImagePath contains the name of the file before the rename/copy
        // and the postImagePath contains the name of the file after the rename/copy
        let preImagePath = '';
        let postImagePath = '';
        let filePath = '';

        // in case of a rename/copy the preImagePath is the token[i+1] and the postImagePath is the token[i+2]
        if (isRenameCopy) {
            preImagePath = tokens[i + 1];
            postImagePath = tokens[i + 2];
            filePath = postImagePath;
            // we increment the cursor by 2 because we have already processed the token[i+1] and token[i+2]
            i = i + 2;
        }
        // in case of NOT a rename/copy the filePath is the third part of the token[i] split by \t and the preImagePath is the empty string
        else {
            filePath = thisTokenParts[2];
        }

        diffs.push({
            linesAdded,
            linesDeleted,
            filePath,
            preImagePath,
            isRenameCopy
        });
    }
    return diffs;
}