"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyClocGitDiffs = exports.reposCommitsPairsDiff = exports.commitDiffPairs = exports.calculateClocGitDiffsChildParent = exports.calculateClocGitDiffs = void 0;
const rxjs_1 = require("rxjs");
const commits_by_month_functions_1 = require("./commits-by-month.functions");
const cloc_diff_functions_1 = require("../../../../cloc-functions/cloc-diff.functions");
const cloc_diff_model_1 = require("../../../../cloc-functions/cloc-diff.model");
const config_1 = require("../../../../config");
const commit_functions_1 = require("../../../../git-functions/commit.functions");
const repo_functions_1 = require("../../../../git-functions/repo.functions");
// calculateClocGitDiffs is a function that receives a CommitPair object and calculates the cloc diff between the two commits
// and returns an object with the yearMonth and the cloc diff
function calculateClocGitDiffs(commitPair, languages) {
    const firstCommit = commitPair.commitPair[0];
    const secondCommit = commitPair.commitPair[1];
    console.log(`Starting diff for ${commitPair.repoPath} -- Date: ${commitPair.commitPair[1].date.toLocaleDateString()}`);
    return (0, cloc_diff_functions_1.runClocDiff)(firstCommit.sha, secondCommit.sha, languages, commitPair.repoPath).pipe((0, rxjs_1.map)(clocDiff => {
        return {
            repoPath: commitPair.repoPath,
            yearMonth: commitPair.yearMonth,
            leastRecentCommitDate: secondCommit.date.toLocaleDateString(),
            clocDiff
        };
    }));
}
exports.calculateClocGitDiffs = calculateClocGitDiffs;
// calculateClocGitDiffsChildParent is a function that receives a CommitCompact object and calculates the cloc diff 
// between this commit and its parent
// and returns an object with the yearMonth, the commit date and the cloc diff
function calculateClocGitDiffsChildParent(commit, repoPath, languages) {
    const childCommitSha = commit.sha;
    const parentCommitSha = `${childCommitSha}^1`;
    console.log(`Starting diff for ${repoPath} -- Date: ${commit.date.toLocaleDateString()}`);
    return (0, cloc_diff_functions_1.runClocDiff)(childCommitSha, parentCommitSha, languages, repoPath).pipe((0, rxjs_1.concatMap)(clocDiff => {
        // we read the parent of the child commit so that we can get the date of the parent commit
        return (0, commit_functions_1.fetchOneCommit)(parentCommitSha, repoPath).pipe((0, rxjs_1.catchError)(() => {
            // in case of error we return an empty commit
            return (0, rxjs_1.of)((0, commit_functions_1.newEmptyCommit)());
        }), (0, rxjs_1.map)(parentCommit => {
            return { clocDiff, parentCommit };
        }), (0, rxjs_1.map)(({ clocDiff, parentCommit }) => {
            const parentCommitDate = parentCommit.date.toLocaleDateString();
            return {
                repoPath,
                yearMonth: (0, commits_by_month_functions_1.yearMonthFromDate)(commit.date),
                mostRecentCommitDate: commit.date.toLocaleDateString(),
                leastRecentCommitDate: parentCommitDate,
                clocDiff
            };
        }));
    }), (0, rxjs_1.concatMap)(stat => {
        // we read the remoteOriginUrl of the repo
        return (0, repo_functions_1.getRemoteOriginUrl)(stat.repoPath).pipe((0, rxjs_1.map)(remoteOriginUrl => {
            remoteOriginUrl = (0, repo_functions_1.gitHttpsUrlFromGitUrl)(remoteOriginUrl);
            return Object.assign(Object.assign({}, stat), { remoteOriginUrl });
        }));
    }));
}
exports.calculateClocGitDiffsChildParent = calculateClocGitDiffsChildParent;
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
function commitDiffPairs(commitsByMonth) {
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
    const pairFirstMonth = firstMonthCommits.length > 1 ?
        [firstMonthCommits[0], firstMonthCommits[firstMonthCommits.length - 1]] :
        null;
    pairs[firstYearMonth] = pairFirstMonth;
    return pairs;
}
exports.commitDiffPairs = commitDiffPairs;
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
// reposCommitsPairsDiff is a function that receives a dictionary where the keys are the repo names and
// the values are dictionaries where the keys are the yearMonth and the values are the array of commits
// belonging to that yearMonth and returns an array of objects where each object has the following structure:
// {
//     repoName: string,
//     commitPairs: { [yearMonth: string]: CommitPair }
// }
// where the commitPairs are the pairs of commits that are to be used to generate the monthly diff,
// i.e. to calculate the differences that the developers have made in the current month compared to the previous month
//
// #copilot - the entire function has been generated by copilot after I have written the comment above
function reposCommitsPairsDiff(reposCommits) {
    const reposCommitsPairs = [];
    for (const repoPath of Object.keys(reposCommits)) {
        const commitsByMonth = reposCommits[repoPath];
        const commitPairs = commitDiffPairs(commitsByMonth);
        reposCommitsPairs.push({ repoPath, commitPairs });
    }
    return reposCommitsPairs;
}
exports.reposCommitsPairsDiff = reposCommitsPairsDiff;
// calculateMonthlyClocGitDiffs is a function that receives an object with the path to a repo and an array of commit pairs
// and an array of languagues we are interested in
// and returns an object with the repoPath and a dictionary where the keys are the yearMonth and the values 
// are the cloc diff between the two commits
function calculateMonthlyClocGitDiffs(repoMonthlyCommitPairs, languages) {
    const repoPath = repoMonthlyCommitPairs.repoPath;
    return (0, rxjs_1.from)(Object.entries(repoMonthlyCommitPairs.commitPairs)).pipe((0, rxjs_1.mergeMap)(([yearMonth, commitPair]) => {
        console.log(`Starting diff for ${yearMonth}-${repoPath}`);
        const diffObs = commitPair ?
            // the first commit is the most recent one
            (0, cloc_diff_functions_1.runClocDiff)(commitPair[0].sha, commitPair[1].sha, languages, repoPath) :
            (0, rxjs_1.of)((0, cloc_diff_model_1.noDiffsClocDiffStats)(languages));
        return diffObs.pipe((0, rxjs_1.map)(clocDiff => {
            console.log(`Completed diff for ${yearMonth}-${repoPath}`);
            return { yearMonth, clocDiff };
        }));
    }, config_1.CONFIG.CONCURRENCY), (0, rxjs_1.reduce)((acc, { yearMonth, clocDiff }) => {
        acc[yearMonth] = clocDiff;
        return acc;
    }, {}), (0, rxjs_1.map)(clocDiffStats => {
        const repoClocDiffStats = { repoPath, clocDiffStats };
        return repoClocDiffStats;
    }));
}
exports.calculateMonthlyClocGitDiffs = calculateMonthlyClocGitDiffs;
//# sourceMappingURL=repo-cloc-diff.functions.js.map