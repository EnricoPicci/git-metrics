import { ExecuteCommandObsOptions, executeCommandObs } from "../tools/execute-command/execute-command";

export function commitsBetweenCommits$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    options?: ExecuteCommandObsOptions
) {
    const command = `cd ${repoFolderPath} && git log --pretty=format:"author: %cn; date: %ci; subject:%s" --name-only ${leastRecentCommit}...${mostRecentCommit}`;
    return executeCommandObs(`read the commits between ${mostRecentCommit} and ${leastRecentCommit}`, command, options)
}