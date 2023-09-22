"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCloc = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../execute-command/execute-command");
const config_1 = require("../config");
// runCloc is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
function runCloc(repoPathOrCommitOrOtherClocId, folderPath = './') {
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc', `cd ${folderPath} && cloc --json --timeout=${config_1.CONFIG.CLOC_TIMEOUT} ${repoPathOrCommitOrOtherClocId}`).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((output) => {
        const firstLine = output[0];
        if (firstLine.startsWith('from stderr: ')) {
            console.error(`Error in runCloc for folder "${folderPath}" and path "${repoPathOrCommitOrOtherClocId}"\nError: ${firstLine}`);
            return [];
        }
        if (!firstLine.startsWith('from stdout: ')) {
            throw new Error('We expect the first line to start with "from stdout: "');
        }
        output[0] = firstLine.substring('from stdout: '.length);
        const clocOutputJson = JSON.parse(output.join('\n'));
        const clocStatsArray = [];
        Object.entries(clocOutputJson).forEach(([language, stats]) => {
            if (language !== 'header') {
                const langStats = {
                    language,
                    nFiles: stats.nFiles,
                    blank: stats.blank,
                    comment: stats.comment,
                    code: stats.code,
                };
                clocStatsArray.push(langStats);
            }
        });
        return clocStatsArray;
    }));
}
exports.runCloc = runCloc;
//# sourceMappingURL=cloc.functions.js.map