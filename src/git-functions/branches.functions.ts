import path from "path";

import { executeCommand } from "../tools/execute-command/execute-command";

import { GitCommandParams } from "./git-params";
import { buildOutfileName } from "./utils/file-name-utils";

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