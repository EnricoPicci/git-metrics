"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClocDiffAllCommand = exports.runClocDiff = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const cloc_diff_model_1 = require("./cloc-diff.model");
const config_1 = require("./config");
// runClocDiff is a function that runs the cloc command to calculate the differences (restricted to the selected languages) between
// 2 commits of the same repo and returns the result in the form of a ClocDiffLanguageStats array
function runClocDiff(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc --git-diff-all', cmd).pipe((0, rxjs_1.map)((output) => {
        let diffs;
        try {
            diffs = JSON.parse(output);
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
        delete clocOutput.header;
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
//# sourceMappingURL=cloc-diff.functions.js.map