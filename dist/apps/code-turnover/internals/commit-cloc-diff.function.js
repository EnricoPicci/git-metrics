"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyClocGitDiffs = exports.calculateClocGitDiffsChildParent = void 0;
const rxjs_1 = require("rxjs");
const cloc_diff_functions_1 = require("../../../cloc-functions/cloc-diff.functions");
const cloc_diff_model_1 = require("../../../cloc-functions/cloc-diff.model");
const commit_functions_1 = require("../../../git-functions/commit.functions");
const repo_functions_1 = require("../../../git-functions/repo.functions");
const config_1 = require("../../../config");
const commits_by_month_functions_1 = require("./commits-by-month.functions");
// calculateClocGitDiffsChildParent is a function that receives a CommitCompact object and calculates the cloc diff
// and returns an object with the yearMonth, the commit date and the cloc diff
function calculateClocGitDiffsChildParent(commit, repoPath, options) {
    const { languages, removeBlanks, removeNFiles, removeComments: removeComment, removeSame } = options;
    const childCommitSha = commit.sha;
    const parentCommitSha = `${childCommitSha}^1`;
    console.log(`Starting diff for ${repoPath} -- Date: ${commit.date.toLocaleDateString()}`);
    return (0, cloc_diff_functions_1.runClocDiff)(childCommitSha, parentCommitSha, languages, repoPath).pipe((0, rxjs_1.concatMap)((clocDiff) => {
        delete clocDiff.diffs.header;
        Object.values(clocDiff.diffs).forEach((diff) => {
            Object.values(diff).forEach((diffForLanguage) => {
                if (removeBlanks)
                    delete diffForLanguage.blank;
                if (removeComment)
                    delete diffForLanguage.comment;
                if (removeNFiles)
                    delete diffForLanguage.nFiles;
            });
        });
        if (removeSame)
            clocDiff.diffs.same = {};
        // we read the parent of the child commit so that we can get the date of the parent commit
        return (0, commit_functions_1.readOneCommitCompact$)(parentCommitSha, repoPath).pipe((0, rxjs_1.catchError)(() => {
            // in case of error we return an empty commit
            return (0, rxjs_1.of)((0, commit_functions_1.newEmptyCommitCompact)());
        }), (0, rxjs_1.map)((parentCommit) => {
            return { clocDiff, parentCommit };
        }), (0, rxjs_1.map)(({ clocDiff, parentCommit }) => {
            const parentCommitDate = parentCommit.date.toLocaleDateString();
            const commitStats = {
                repoPath,
                yearMonth: (0, commits_by_month_functions_1.yearMonthFromDate)(commit.date),
                mostRecentCommitDate: commit.date.toLocaleDateString(),
                leastRecentCommitDate: parentCommitDate,
                comment: commit.comment,
                clocDiff,
                remoteOriginUrl: '',
            };
            return commitStats;
        }));
    }), (0, rxjs_1.concatMap)((stat) => {
        // we read the remoteOriginUrl of the repo
        return (0, repo_functions_1.getRemoteOriginUrl)(stat.repoPath).pipe((0, rxjs_1.map)((remoteOriginUrl) => {
            remoteOriginUrl = (0, repo_functions_1.gitHttpsUrlFromGitUrl)(remoteOriginUrl);
            stat.remoteOriginUrl = remoteOriginUrl;
            return stat;
        }));
    }));
}
exports.calculateClocGitDiffsChildParent = calculateClocGitDiffsChildParent;
// calculateMonthlyClocGitDiffs is a function that receives an object with the path to a repo and an array of commit pairs
// and an array of languagues we are interested in
// and returns an object with the repoPath and a dictionary where the keys are the yearMonth and the values
// are the cloc diff between the two commits
function calculateMonthlyClocGitDiffs(repoMonthlyCommitPairs, languages) {
    const repoPath = repoMonthlyCommitPairs.repoPath;
    return (0, rxjs_1.from)(Object.entries(repoMonthlyCommitPairs.commitPairs)).pipe((0, rxjs_1.mergeMap)(([yearMonth, commitPair]) => {
        console.log(`Starting diff for ${yearMonth}-${repoPath}`);
        const diffObs = commitPair
            ? // the first commit is the most recent one
                (0, cloc_diff_functions_1.runClocDiff)(commitPair[0].sha, commitPair[1].sha, languages, repoPath)
            : (0, rxjs_1.of)((0, cloc_diff_model_1.newDiffsClocDiffStats)(languages));
        return diffObs.pipe((0, rxjs_1.map)((clocDiff) => {
            console.log(`Completed diff for ${yearMonth}-${repoPath}`);
            return { yearMonth, clocDiff };
        }));
    }, config_1.CONFIG.CONCURRENCY), (0, rxjs_1.reduce)((acc, { yearMonth, clocDiff }) => {
        acc[yearMonth] = clocDiff;
        return acc;
    }, {}), (0, rxjs_1.map)((clocDiffStats) => {
        const repoClocDiffStats = { repoPath, clocDiffStats };
        return repoClocDiffStats;
    }));
}
exports.calculateMonthlyClocGitDiffs = calculateMonthlyClocGitDiffs;
//# sourceMappingURL=commit-cloc-diff.function.js.map