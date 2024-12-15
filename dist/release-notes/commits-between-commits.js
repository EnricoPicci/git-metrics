"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitsBetweenCommits$ = void 0;
const execute_command_1 = require("../tools/execute-command/execute-command");
function commitsBetweenCommits$(mostRecentCommit, leastRecentCommit, repoFolderPath = './', options = {}) {
    const command = `cd ${repoFolderPath} && git log --pretty=format:"author: %cn; date: %ci; subject:%s" --name-only ${leastRecentCommit}...${mostRecentCommit}`;
    return (0, execute_command_1.executeCommandObs$)(`read the commits between ${mostRecentCommit} and ${leastRecentCommit}`, command, options);
}
exports.commitsBetweenCommits$ = commitsBetweenCommits$;
//# sourceMappingURL=commits-between-commits.js.map