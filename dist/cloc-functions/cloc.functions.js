"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCloc = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const config_1 = require("../config");
// runCloc is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
function runCloc(repoPath = './', vcs) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc', `cloc --json ${_vcs} --timeout=${config_1.CONFIG.CLOC_TIMEOUT} ${repoPath}`).pipe((0, rxjs_1.map)((output) => {
        const clocOutputJson = JSON.parse(output);
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