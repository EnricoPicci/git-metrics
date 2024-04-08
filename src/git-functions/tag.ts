import path from "path";

import { executeCommand, executeCommandObs$ } from "../tools/execute-command/execute-command";

import { GitCommandParams } from "./git-params";
import { GIT_CONFIG } from "./config";
import { buildOutfileName } from "./utils/file-name-utils";
import { concatMap, map } from "rxjs";
import { Tag } from "./tag.model";

export const SEP = GIT_CONFIG.COMMIT_REC_SEP;

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


export function readTags$(config: GitCommandParams) {
    const cmd = readTagsCommand(config);
    return executeCommandObs$('readTags', cmd).pipe(
        map((out) => {
            return out.split('\n').filter((line) => line.trim().length > 0);
        }),
    );
}

export function readTag$(config: GitCommandParams) {
    return readTags$(config).pipe(
        concatMap((tags) => tags),
        map((tagString) => {
            const [hash, _tagName, _commitSubject, date] = tagString.split(SEP)
            if (hash === '2a70da7c') {
                console.log('tagString', tagString)
            }
            const tagName = _tagName.replaceAll(',', ' - ')
            const commitSubject = _commitSubject.replaceAll(',', ' - ')
            const repoPath = config.repoFolderPath ?? ''
            const tag: Tag = { hash, tagName, commitSubject, repoPath, date }
            return tag;
        }),
    )
}

/**
 * Reads the tags from a Git repository and logs a message to the console indicating the folder where 
 * the tags were read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readTagsCommand` function.
 * @returns The path to the file where the output was saved.
 */
export function writeTags(config: GitCommandParams) {
    const [cmd, out] = writeTagsCommand(config);
    executeCommand('writeTags', cmd);
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

export function readTagsCommand(config: GitCommandParams) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    return `git ${repoFolder} log --no-walk --tags --pretty='%h${SEP}%d${SEP}%s${SEP}%ai' --decorate=full`;
}

export function writeTagsCommand(config: GitCommandParams) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outFile!, repoFolder, '', '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`${readTagsCommand(config)} > ${out}`, out];
}