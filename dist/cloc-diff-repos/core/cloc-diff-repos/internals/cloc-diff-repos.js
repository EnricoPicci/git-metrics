"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenMonthlyClocDiffStatsDict = exports.calculateMonthlyClocDiffsOnRepos = exports.calculateClocDiffsOnRepos = exports.calculateCodeTurnover = void 0;
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const config_1 = require("../../../../config");
const repo_cloc_diff_functions_1 = require("../../../internals/git-functions/repo-cloc-diff.functions");
const repos_by_month_functions_1 = require("../../../internals/git-functions/repos-by-month.functions");
const repos_by_month_functions_2 = require("../../../internals/git-functions/repos-by-month.functions");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const repo_functions_1 = require("../../../../git-functions/repo.functions");
// calculateCodeTurnover is a function that calculates the cloc diffs on the repos contained in a folder
function calculateCodeTurnover(folderPath, outdir, languages, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = config_1.CONFIG.CONCURRENCY, excludeRepoPaths = []) {
    return calculateClocDiffsOnRepos(folderPath, outdir, languages, fromDate, toDate, concurrency, excludeRepoPaths);
}
exports.calculateCodeTurnover = calculateCodeTurnover;
function calculateClocDiffsOnRepos(folderPath, outdir, languages, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = config_1.CONFIG.CONCURRENCY, excludeRepoPaths = []) {
    const startTime = new Date().getTime();
    const folderName = path_1.default.basename(folderPath);
    let diffsCompleted = 0;
    let diffsRemaining = 0;
    let diffsErrored = 0;
    return (0, repo_functions_1.reposCompactInFolderObs)(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((repos) => {
        return (0, rxjs_1.from)(repos);
    }), (0, rxjs_1.mergeMap)((repo) => {
        const commitWithRepoPath = repo.commits.map(commit => {
            return { commit, repoPath: repo.path };
        });
        return (0, rxjs_1.from)(commitWithRepoPath);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(commitsWithRepo => {
        diffsRemaining = commitsWithRepo.length;
        // sort commitsWithRepo by commit date ascending
        commitsWithRepo.sort((a, b) => {
            return a.commit.date.getTime() - b.commit.date.getTime();
        });
        return (0, rxjs_1.from)(commitsWithRepo);
    }), (0, rxjs_1.mergeMap)(({ commit, repoPath }) => {
        return (0, repo_cloc_diff_functions_1.calculateClocGitDiffsChildParent)(commit, repoPath, languages).pipe((0, rxjs_1.tap)((stat) => {
            if (stat.clocDiff.error) {
                diffsErrored++;
            }
            else {
                diffsCompleted++;
            }
            diffsRemaining--;
            console.log(`====>>>> commit diffs completed: ${diffsCompleted} `);
            console.log(`====>>>> commit diffs remaining: ${diffsRemaining} `);
            console.log(`====>>>> commit diffs errored: ${diffsErrored} `);
        }));
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc-diff.json`);
        return writeClocDiffJson(stats, outFile).pipe((0, rxjs_1.tap)(() => {
            console.log(`\n====>>>> commit diffs errors can be seen in: ${outFile} (look for error property)\n`);
        }), (0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc-diff.csv`);
        return writeClocCsv(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.tap)(() => {
        const endTime = new Date().getTime();
        console.log(`====>>>> Total time to calculate cloc diffs: ${(endTime - startTime) / 1000} seconds`);
    }));
}
exports.calculateClocDiffsOnRepos = calculateClocDiffsOnRepos;
// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
function calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = config_1.CONFIG.CONCURRENCY) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repos_by_month_functions_2.reposCompactWithCommitsByMonthsInFolderObs)(folderPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((repos) => {
        const reposCommits = (0, repos_by_month_functions_1.newReposWithCommitsByMonth)(repos);
        const reposCommitsDict = (0, repos_by_month_functions_1.repoCommitsByMonthRecordsDict)(reposCommits);
        const repoMonthlyCommitPairs = (0, repo_cloc_diff_functions_1.reposCommitsPairsDiff)(reposCommitsDict);
        return (0, rxjs_1.from)(repoMonthlyCommitPairs);
    }), (0, rxjs_1.mergeMap)((repoMonthlyClocDiffs) => {
        return (0, repo_cloc_diff_functions_1.calculateMonthlyClocGitDiffs)(repoMonthlyClocDiffs, languages);
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-monthly-cloc-diff.json`);
        return writeMonthlyClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-monthly-cloc-diff.csv`);
        return writeMonthlyClocCsv(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }));
}
exports.calculateMonthlyClocDiffsOnRepos = calculateMonthlyClocDiffsOnRepos;
const writeClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, statsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function statsToCsv(reposStats) {
    const csvRecs = reposStats
        .filter(stat => !stat.clocDiff.error)
        .map(stat => flattenClocDiffStat(stat)).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
function flattenClocDiffStat(stat) {
    const remoteOriginUrl = stat.remoteOriginUrl;
    const repoPath = stat.repoPath;
    const yearMonth = stat.yearMonth;
    const clocDiffStat = stat.clocDiff;
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git') ? remoteOriginUrl.slice(0, -4) : remoteOriginUrl;
    const mostRecentCommitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${clocDiffStat.mostRecentCommitSha}`;
    const base = {
        remoteOriginUrl,
        repoPath,
        yearMonth,
        leastRecentCommitDate: stat.leastRecentCommitDate,
        mostRecentCommitDate: stat.mostRecentCommitDate,
        leastRecentCommit: clocDiffStat.leastRecentCommitSha,
        mostRecentCommit: clocDiffStat.mostRecentCommitSha,
        mostRecentCommitUrl
    };
    return clocDiffStatToCsvWithBase(clocDiffStat.diffs, base, repoPath, clocDiffStat.leastRecentCommitSha, clocDiffStat.mostRecentCommitSha);
}
const writeMonthlyClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeMonthlyClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, monthlyStatsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function monthlyStatsToCsv(reposStats) {
    const csvRecs = reposStats.map(stats => flattenMonthlyClocDiffStatsDict(stats)).flat();
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
            previousMonthCommit: clocDiffStat.leastRecentCommitSha
        };
        return clocDiffStatToCsvWithBase(clocDiffStat, base, repoPath, clocDiffStat.leastRecentCommitSha, clocDiffStat.mostRecentCommitSha);
    });
    return clocDiffTypeStatsListFlat.flat();
}
exports.flattenMonthlyClocDiffStatsDict = flattenMonthlyClocDiffStatsDict;
function clocDiffStatToCsvWithBase(clocDiffStat, base, repoPath, leastRecentCommit, mostRecentCommit) {
    let sameFlat = [];
    if (!clocDiffStat) {
        console.warn('!!!!!!!!! No SAME stats for ${repoPath}');
    }
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'same', language, stat, value });
            }).flat();
        }).flat();
    }
    else {
        console.warn(`!!!!!!!!! No SAME stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let addedFlat = [];
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'added', language, stat, value });
            }).flat();
        }).flat();
    }
    else {
        console.warn(`!!!!!!!!! No ADDED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let removedFlat = [];
    if (clocDiffStat.removed) {
        removedFlat = Object.entries(clocDiffStat.removed).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'removed', language, stat, value });
            }).flat();
        }).flat();
    }
    else {
        console.warn(`!!!!!!!!! No REMOVED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let modifiedFlat = [];
    if (clocDiffStat.modified) {
        modifiedFlat = Object.entries(clocDiffStat.modified).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'modified', language, stat, value });
            }).flat();
        }).flat();
    }
    else {
        console.warn(`!!!!!!!!! No MODIFIED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    const csvRecords = [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat];
    return csvRecords;
}
//# sourceMappingURL=cloc-diff-repos.js.map