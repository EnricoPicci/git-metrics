"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yearMonthFromDate = exports.newCommitsByMonth = void 0;
// commitsByMonth returns an instance of CommitsByMonths, where CommitCompact objects are grouped by month
// #copilot - the entire method has been generated by copilot, the only thing I changes was the key where copilot put
// month first and year second, I changed it to year first and month second
// I also changed the format of the month to be 2 digits
function newCommitsByMonth(commits) {
    const commitsByMonth = commits.reduce((acc, commit) => {
        const key = yearMonthFromDate(commit.date);
        if (!acc[key]) {
            acc[key] = {
                commits: [],
                authors: new Set()
            };
        }
        acc[key].commits.push(commit);
        acc[key].authors.add(commit.author);
        return acc;
    }, {});
    return commitsByMonth;
}
exports.newCommitsByMonth = newCommitsByMonth;
function yearMonthFromDate(date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${year}-${month}`;
}
exports.yearMonthFromDate = yearMonthFromDate;
//# sourceMappingURL=commits-by-month.functions.js.map