import path from "path";

import { executeCommand } from "../tools/execute-command/execute-command";

import { GitCommandParams } from "./git-params";
import { GIT_CONFIG } from "./config";
import { buildOutfileName } from "./utils/file-name-utils";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Reads the tags from a Git repository and logs a message to the console indicating the folder where 
 * the tags were read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readTagsCommand` function.
 * @returns The path to the file where the output was saved.
 */
export function readTags(config: GitCommandParams) {
    const [cmd, out] = readTagsCommand(config);
    executeCommand('readTags', cmd);
    console.log(
        `====>>>> Tags read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export const SEP = GIT_CONFIG.COMMIT_REC_SEP;

export function readTagsCommand(config: GitCommandParams) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outFile!, repoFolder, '', '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --no-walk --tags --pretty='${SEP}%h${SEP}%d${SEP}%s' --decorate=full > ${out}`, out];
}