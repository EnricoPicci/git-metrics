"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAll = void 0;
const cloc_1 = require("./cloc");
const read_git_1 = require("./read-git");
// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
function readAll(commitOptions, readClocOptions) {
    // execute the git log command to extract the commits
    const commitLogPath = (0, read_git_1.readCommits)(commitOptions);
    // execute the cloc commands
    const clocLogPath = (0, cloc_1.createClocLog)(readClocOptions, 'readAll-fileLinesOptions');
    const clocSummaryPath = (0, cloc_1.createSummaryClocLog)(readClocOptions);
    return [commitLogPath, clocLogPath, clocSummaryPath];
}
exports.readAll = readAll;
//# sourceMappingURL=read-all.js.map