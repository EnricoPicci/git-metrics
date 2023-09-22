"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yearMonthFromDate = exports.newCommitPair = void 0;
function newCommitPair(repoPath, leastRecentCommit, mostRecentCommit) {
    const commitPairObj = {
        repoPath,
        yearMonth: yearMonthFromDate(mostRecentCommit.date),
        mostRecentCommitDate: mostRecentCommit.date.toLocaleString(),
        commitPair: [leastRecentCommit, mostRecentCommit]
    };
    return commitPairObj;
}
exports.newCommitPair = newCommitPair;
function yearMonthFromDate(date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${year}-${month}`;
}
exports.yearMonthFromDate = yearMonthFromDate;
//# sourceMappingURL=commit.model.js.map