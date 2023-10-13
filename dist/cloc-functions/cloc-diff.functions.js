"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClocDiffAllCommand = exports.runClocDiff = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const cloc_diff_model_1 = require("./cloc-diff.model");
const config_1 = require("./config");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Runs the cloc command to calculate the differences (restricted to the selected languages) between 2 commits of the same
 * repo and returns the result in the form of a `ClocDiffLanguageStats` Observable stream.
 * @param mostRecentCommit The SHA of the most recent commit.
 * @param leastRecentCommit The SHA of the least recent commit.
 * @param languages An array of languages to include in the cloc diff.
 * @param folderPath The path to the folder containing the Git repository. Defaults to './'.
 * @returns An Observable that emits a `ClocDiffStats` object representing the cloc diff between the two commits.
 */
function runClocDiff(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc --git-diff-all', cmd).pipe((0, rxjs_1.map)((output) => {
        let diffs;
        try {
            diffs = JSON.parse(output);
            evaluateIfPossibleCutPaste(diffs);
        }
        catch (error) {
            if (output.includes('Nothing to count.')) {
                return (0, cloc_diff_model_1.newClocDiffStatsZeroed)(mostRecentCommit, leastRecentCommit);
            }
            const err = `Error parsing JSON returned by cloc-diff command"\nError: ${error}
Input to Json parser: ${output}
Command: ${cmd}`;
            console.error(err);
            const clocOutputWithError = (0, cloc_diff_model_1.newClocDiffStatsWithError)(mostRecentCommit, leastRecentCommit, err);
            return clocOutputWithError;
        }
        const clocOutput = {
            mostRecentCommitSha: mostRecentCommit,
            leastRecentCommitSha: leastRecentCommit,
            diffs,
        };
        return clocOutput;
    }), (0, rxjs_1.catchError)((error) => {
        const err = `Error in buildClocDiffAllCommand for folder "${folderPath}"\nError: ${error}
Command: ${cmd}`;
        console.error(err);
        console.error(`Command: ${cmd}`);
        const clocOutputWithError = (0, cloc_diff_model_1.newClocDiffStatsWithError)(mostRecentCommit, leastRecentCommit, err);
        return (0, rxjs_1.of)(clocOutputWithError);
    }));
}
exports.runClocDiff = runClocDiff;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
function buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cdCommand = `cd ${folderPath}`;
    const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${config_1.CLOC_CONFIG.TIMEOUT}`;
    // const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}
exports.buildClocDiffAllCommand = buildClocDiffAllCommand;
function evaluateIfPossibleCutPaste(diffs) {
    const added = diffs.added;
    const removed = diffs.removed;
    const languages = Object.keys(added);
    languages.forEach((lang) => {
        const addedStats = added[lang];
        const removedStats = removed[lang];
        // isPossibleCutPaste is true if the same amount of code was added and removed, as well as the amount of blank and comment
        // lines. Also, the amount of files added and removed must be the same. Finally, the amount of code added must be greater than
        // zero and the amount of comment and blank lines must be not null and greater than zero.
        const isPossibleCutPaste = addedStats.code === removedStats.code &&
            addedStats.blank === removedStats.blank &&
            addedStats.comment === removedStats.comment &&
            addedStats.nFiles === removedStats.nFiles &&
            addedStats.code > 0 && !!addedStats.comment && !!addedStats.blank;
        // the value of possibleCutPaste is the same for both added and removed ans is set based on the above calculation
        addedStats.possibleCutPaste = isPossibleCutPaste;
        removedStats.possibleCutPaste = isPossibleCutPaste;
    });
}
//# sourceMappingURL=cloc-diff.functions.js.map