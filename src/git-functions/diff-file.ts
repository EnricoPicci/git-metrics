import { map } from "rxjs";
import { executeCommandObs } from "../tools/execute-command/execute-command";

export function diff$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    similarityIndex = 50,
) {
    const cmd = buildDiffCommand(mostRecentCommit, leastRecentCommit, repoFolderPath, similarityIndex);
    return executeCommandObs('run git diff', cmd).pipe(
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

function buildDiffCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    folderPath: string,
    similarityIndex: number
) {
    const cdCommand = `cd ${folderPath}`;
    let clocDiffAllCommand = `git diff --numstat -M${similarityIndex} -z ${mostRecentCommit} ${leastRecentCommit}`;
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
        let preImagePath = '';
        let filePath = '';

        // in case of a rename/copy the preImagePath is the token[i+1] and the postImagePath is the token[i+2]
        if (isRenameCopy) {
            filePath = tokens[i + 1];
            preImagePath = tokens[i + 2];
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