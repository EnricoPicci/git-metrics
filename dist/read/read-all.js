"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAll = void 0;
const cloc_1 = require("./cloc");
const read_git_1 = require("./read-git");
// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
function readAll(commitOptions, readClocOptions) {
    // execute the git log command to extract the commits
    const commitLogPath = (0, read_git_1.readCommits)(commitOptions);
    // execute the git log command to extract the commits
    const clocLogPath = (0, cloc_1.createClocLog)(readClocOptions, 'readAll-fileLinesOptions');
    return [commitLogPath, clocLogPath];
}
exports.readAll = readAll;
//# sourceMappingURL=read-all.js.map