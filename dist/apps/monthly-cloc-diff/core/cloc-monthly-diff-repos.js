"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenMonthlyClocDiffStatsDict = exports.calculateMonthlyClocDiffsOnRepos = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const config_1 = require("../../../config");
const commit_monthly_pair_1 = require("../internals/commit-monthly-pair");
const repos_with_commits_by_month_functions_1 = require("../internals/repos-with-commits-by-month.functions");
const commit_cloc_diff_1 = require("../internals/commit-cloc-diff");
const cloc_diff_stat_csv_1 = require("./cloc-diff-stat-csv");
// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
function calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = config_1.CONFIG.CONCURRENCY) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repos_with_commits_by_month_functions_1.reposCompactWithCommitsByMonthsInFolderObs)(folderPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((repos) => {
        const reposCommits = (0, repos_with_commits_by_month_functions_1.newReposWithCommitsByMonth)(repos);
        const reposCommitsDict = (0, repos_with_commits_by_month_functions_1.repoCommitsByMonthRecordsDict)(reposCommits);
        const repoMonthlyCommitPairs = (0, commit_monthly_pair_1.commitsMonthlyPairsForRepos)(reposCommitsDict);
        return (0, rxjs_1.from)(repoMonthlyCommitPairs);
    }), (0, rxjs_1.mergeMap)((repoMonthlyClocDiffs) => {
        return (0, commit_cloc_diff_1.calculateMonthlyClocGitDiffs)(repoMonthlyClocDiffs, languages);
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-monthly-cloc-diff.json`);
        return writeMonthlyClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-monthly-cloc-diff.csv`);
        return writeMonthlyClocCsv(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }));
}
exports.calculateMonthlyClocDiffsOnRepos = calculateMonthlyClocDiffsOnRepos;
const writeMonthlyClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)]).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeMonthlyClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, monthlyStatsToCsv(stats)).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function monthlyStatsToCsv(reposStats) {
    const csvRecs = reposStats.map((stats) => flattenMonthlyClocDiffStatsDict(stats)).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
function flattenMonthlyClocDiffStatsDict(stats) {
    const repoPath = stats.repoPath;
    const clocDiffStats = stats.clocDiffStats;
    const clocDiffStatsList = Object.keys(clocDiffStats).map((yearMonth) => {
        return Object.assign({ yearMonth }, clocDiffStats[yearMonth]);
    });
    const clocDiffStatsListFlat = clocDiffStatsList.map((clocDiffStat) => {
        const diffTypes = clocDiffStat.diffs;
        const clocDiffStatFlat = Object.assign(Object.assign({}, clocDiffStat), diffTypes);
        delete clocDiffStatFlat.diffs;
        return clocDiffStatFlat;
    });
    const clocDiffTypeStatsListFlat = clocDiffStatsListFlat.map((clocDiffStat) => {
        const base = {
            repoPath,
            yearMonth: clocDiffStat.yearMonth,
            lastCommitInMonth: clocDiffStat.mostRecentCommitSha,
            previousMonthCommit: clocDiffStat.leastRecentCommitSha,
        };
        return (0, cloc_diff_stat_csv_1.clocDiffStatToCsvWithBase)(clocDiffStat, base);
    });
    return clocDiffTypeStatsListFlat.flat();
}
exports.flattenMonthlyClocDiffStatsDict = flattenMonthlyClocDiffStatsDict;
//# sourceMappingURL=cloc-monthly-diff-repos.js.map