import path from "path";

import { executeCommand, executeCommandObs } from "../tools/execute-command/execute-command";

import { GitCommandParams } from "./git-params";
import { buildOutfileName } from "./utils/file-name-utils";
import { map } from "rxjs";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Reads the branches graph from a Git repository and logs a message to the console indicating the folder 
 * where the branches graph was read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readBranchesGraphCommand` function.
 * @returns The path to the file where the output was saved.
 */
export function readBranchesGraph(config: GitCommandParams) {
    const [cmd, out] = readBranchesGraphCommand(config);
    executeCommand('readBranchesGraph', cmd);
    console.log(
        `====>>>> Branches graph read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
/**
 * Fetches the default branch name for a Git repository and returns an Observable that emits the branch name.
 * @param repoPath The path to the Git repository.
 * @returns An Observable that emits the default branch name for the repository.
 * @throws An error if the output of the git command does not match the expected format.
 */
export function defaultBranchName$(repoPath: string) {
    // build the command to fetch the default branch name
    // see https://stackoverflow.com/a/67170894
    const gitCommand = `cd ${repoPath} && git pull && git branch --remotes --list '*/HEAD'`;
    return executeCommandObs(`fetch default branch name for ${repoPath}`, gitCommand).pipe(
        map((output) => {
            // the output is something like:
            // fetching origin
            // origin/HEAD -> origin/master
            // hence we split the second line with / and take the third element
            const lines = output.split('\n');
            if (lines.length < 2) {
                throw new Error(`Error: while fetching default branch name for repo "${repoPath}"
                we expected to have at least 2 lines with the first one being something like "fetching origin" but we got "${output}"
                Command erroring: "${gitCommand}"`);
            }
            // we take the second line which we expect to be something like "origin/HEAD -> origin/master"
            const parts = output.split('\n')[1].split('/');
            if (parts.length !== 3) {
                throw new Error(`Error: while fetching default branch name for repo "${repoPath}"
                we expected a string with format "origin/HEAD -> origin/master" but we got "${output}"
                Command erroring: "${gitCommand}"`);
            }
            const branchName = parts[2];
            return branchName;
        })
    )
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

// private function exported only for test purposes
export function readBranchesGraphCommand(config: GitCommandParams) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outFile!, repoFolder, '', '-branches.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --all --graph --date=short --pretty=medium > ${out}`, out];
}