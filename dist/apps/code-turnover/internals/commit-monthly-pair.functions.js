"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitsMonthlyPairsForRepos = exports.commitMonthlyPairs = void 0;
// commitDiffPairs is a function that take a dictionary where the keys are yearMonth and the values are the array of commits
// belonging to that yearMonth and returns a dictionary whose keys are the tearMonth
// and whose values are pairs of commits that are to be used to generate the monthly diff,
// i.e. to calculate the differences that the developers have made in the current month compared to the previous month
//
// Let's consider this example:
// yearMonth            commits
// 2020-03              [commit9, commit8, commit7]        // commits are ordered by date from the most recent to the oldest
// 2020-02              [commit6, commit5, commit4, commit3]
// 2020-01              [commit2, commit1, commit0]
//
// The result of this function will be:
// 2020-03              [commit9, commit6]
// 2020-02              [commit6, commit3]
// 2020-01              [commit3, commit1]
//
// If a month has no commits then the value for that month will be null and the commit to be used to calculate
// the diff generated in the previous month will be the first commit found going backwards, for instance
// yearMonth            commits
// 2020-03              [commit6, commit5, commit4, commit3]
// 2020-02              []
// 2020-01              [commit2, commit1]
//
// The result of this function will be:
// 2020-03              [commit6, commit2]
// 2020-02              null
// 2020-01              [commit2, commit1]
//
// If the last month has just one commit then the value for that month will be null, like in this example:
// yearMonth            commits
// 2020-03              [commit6, commit5, commit4, commit3]
// 2020-02              [commit2]
// 2020-01              [commit1]
//
// The result of this function will be:
// 2020-03              [commit6, commit2]
// 2020-02              [commit2, commit1]
// 2020-01              null
//
// #copilot - after having written the comment (where copilot helped in the repeated parts as the description of the examples)
// a good part of the structure of this method has been generated by copilot - the original logic proposed by copilot
// was not correct but it was a good starting point
function commitMonthlyPairs(commitsByMonth) {
    const yearMonths = Object.keys(commitsByMonth).sort().reverse();
    const pairs = {};
    for (let i = 0; i < yearMonths.length - 1; i++) {
        const yearMonth = yearMonths[i];
        const commits = commitsByMonth[yearMonth];
        // sort the commits per date from most recent to least recent
        // #copilot - i was not remeembering how to sort per date but, rather than going to stackoverflow, copilot suggested me
        commits.sort((a, b) => b.date.getTime() - a.date.getTime());
        if (commits.length === 0) {
            pairs[yearMonth] = null;
            continue;
        }
        const mostRecentCommit = commits[0];
        const leastRecentCommit = findLeastRecentCommit(commitsByMonth, i, yearMonths);
        const newPair = leastRecentCommit ? [mostRecentCommit, leastRecentCommit] : null;
        pairs[yearMonth] = newPair;
    }
    // the pair for the oldest month is composed by the most recent and least recent commit of that month
    // if there are at least two commits in that month, otherwise the pair will be null
    const firstYearMonth = yearMonths[yearMonths.length - 1];
    const firstMonthCommits = commitsByMonth[firstYearMonth];
    const pairFirstMonth = firstMonthCommits.length > 1 ? [firstMonthCommits[0], firstMonthCommits[firstMonthCommits.length - 1]] : null;
    pairs[firstYearMonth] = pairFirstMonth;
    return pairs;
}
exports.commitMonthlyPairs = commitMonthlyPairs;
function findLeastRecentCommit(commitsByMonth, i, yearMonths) {
    for (let j = i + 1; j < yearMonths.length; j++) {
        const yearMonth = yearMonths[j];
        const commits = commitsByMonth[yearMonth];
        commits.sort((a, b) => b.date.getTime() - a.date.getTime());
        if (commits.length > 0) {
            return commits[0];
        }
    }
    // returning null means that there are no commits in the previous months
    return null;
}
// commitsMonthlyPairsForRepos is a function that receives a dictionary where the keys are the repo names and
// the values are dictionaries where the keys are the yearMonth and the values are the array of commits
// belonging to that yearMonth and returns an array of objects where each object has the following structure:
// {
//     repoName: string,
//     commitPairs: { [yearMonth: string]: CommitTuple }
// }
// where the commitTuple are the pairs of commits that are to be used to generate the monthly diff,
// i.e. to calculate the differences that the developers have made in the current month compared to the previous month
//
// #copilot - the entire function has been generated by copilot after I have written the comment above
function commitsMonthlyPairsForRepos(reposCommits) {
    const reposCommitsPairs = [];
    for (const repoPath of Object.keys(reposCommits)) {
        const commitsByMonth = reposCommits[repoPath];
        const commitPairs = commitMonthlyPairs(commitsByMonth);
        reposCommitsPairs.push({ repoPath, commitPairs });
    }
    return reposCommitsPairs;
}
exports.commitsMonthlyPairsForRepos = commitsMonthlyPairsForRepos;
//# sourceMappingURL=commit-monthly-pair.functions.js.map