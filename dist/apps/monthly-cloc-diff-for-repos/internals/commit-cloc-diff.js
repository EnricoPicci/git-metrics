"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyClocGitDiffs = void 0;
const rxjs_1 = require("rxjs");
const cloc_diff_1 = require("../../../cloc-functions/cloc-diff");
const cloc_diff_model_1 = require("../../../cloc-functions/cloc-diff.model");
const config_1 = require("../../../config");
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
                (0, cloc_diff_1.clocDiff$)(commitPair[0].sha, commitPair[1].sha, repoPath, languages)
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
//# sourceMappingURL=commit-cloc-diff.js.map