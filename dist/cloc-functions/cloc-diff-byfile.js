"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOC_DIFF_BYFILE_HEADER = exports.clocDiffWithParentByfile$ = exports.clocDiffByfile$ = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const ignore_up_to_1 = require("../tools/rxjs-operators/ignore-up-to");
const config_1 = require("./config");
const cloc_diff_byfile_model_1 = require("./cloc-diff-byfile.model");
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
function clocDiffByfile$(mostRecentCommit, leastRecentCommit, repoFolderPath = './', languages = []) {
    const cmd = buildClocDiffRelByFileCommand(mostRecentCommit, leastRecentCommit, languages, repoFolderPath);
    return (0, execute_command_1.executeCommandObs)('run cloc --git-diff-rel --by-file', cmd).pipe((0, rxjs_1.map)((output) => {
        return output.split('\n');
    }), (0, rxjs_1.concatMap)(lines => {
        return (0, rxjs_1.from)(lines);
    }), (0, ignore_up_to_1.ignoreUpTo)(exports.CLOC_DIFF_BYFILE_HEADER), 
    // skip the header line
    (0, rxjs_1.skip)(1), (0, rxjs_1.filter)(line => line.length > 0), (0, rxjs_1.map)(line => {
        return (0, cloc_diff_byfile_model_1.newClocDiffByfile)(line);
    }));
}
exports.clocDiffByfile$ = clocDiffByfile$;
/**
 * Calculates the cloc diff for each file in a Git repository between a commit and its parent,
 * considering only the files of languages that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffByfile.
 * @param commit The hash of the commit to calculate the cloc diff for.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffByfile.
 */
function clocDiffWithParentByfile$(commit, repoFolderPath = './', languages = []) {
    return clocDiffByfile$(commit, `${commit}^1`, repoFolderPath, languages);
}
exports.clocDiffWithParentByfile$ = clocDiffWithParentByfile$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
exports.CLOC_DIFF_BYFILE_HEADER = 'File, == blank, != blank, + blank, - blank, == comment, != comment, + comment, - comment, == code, != code, + code, - code,';
function buildClocDiffRelByFileCommand(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cdCommand = `cd ${folderPath}`;
    let clocDiffAllCommand = `cloc --git-diff-rel --csv --by-file --timeout=${config_1.CLOC_CONFIG.TIMEOUT}`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}
//# sourceMappingURL=cloc-diff-byfile.js.map