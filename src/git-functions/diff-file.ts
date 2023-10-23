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
            const tokens = output.split('\0');
            if (tokens.length === 0) {
                console.log(`No files changed between ${mostRecentCommit} and ${leastRecentCommit}`);
                return [];
            }
            if (tokens.length % 3 < 0) {
                throw new Error(`Error parsing git diff output: ${output} - we expect at least 3 values per line
                as per documentation https://git-scm.com/docs/git-diff#_other_diff_formats`);
            }

            const diffs: {
                linesAdded: number,
                linesDeleted: number,
                preImageFileName: string,
                postImageFileName: string,
                isRenameCopy: boolean,
            }[] = [];

            for (let i = 0; i < tokens.filter(token => token.length > 0).length; i++) {
                const linedAddedDeletedAndName = tokens[i].split('\t');
                // there must be 3 values per lines added and deleted and one value for the file name
                if (linedAddedDeletedAndName.length !== 3) {
                    throw new Error(`Error parsing git diff output: ${output} - we expect 2 values per line
                    as per documentation https://git-scm.com/docs/git-diff#_other_diff_formats`);
                }
                const linesAdded = parseInt(linedAddedDeletedAndName[0]);
                const linesDeleted = parseInt(linedAddedDeletedAndName[1]);
                let preImageFileName = '';
                let postImageFileName = ''
                // check if tokens[i + 1] can be split eith \t - if yes, then thenext token holds the lines added and deleted
                // of the next diff, otherwise we are in the case of a rename or copy and the next token holds the new file name
                const nextToken = tokens[i + 1];
                const nextNextToken = tokens[i + 2];
                const nextNextTokenParts = nextNextToken.split('\t');
                const isRenameCopy = nextNextTokenParts.length !== 3;

                preImageFileName = nextToken;
                i++

                if (isRenameCopy) {
                    postImageFileName = nextToken;
                    preImageFileName = nextNextToken;
                    i++;
                }

                diffs.push({
                    linesAdded,
                    linesDeleted,
                    preImageFileName,
                    postImageFileName,
                    isRenameCopy
                });
            }
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