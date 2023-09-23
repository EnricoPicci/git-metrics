"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateClocDiffsOnRepos = exports.calculateCodeTurnover = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const to_csv_1 = require("../../../../0-tools/csv/to-csv");
const config_1 = require("../../../../config");
const repo_functions_1 = require("../../../../git-functions/repo.functions");
const cloc_diff_stat_csv_1 = require("./cloc-diff-stat-csv");
const commit_cloc_diff_function_1 = require("./commit-cloc-diff.function");
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
    return (0, repo_functions_1.reposCompactInFolderObs)(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe(
    // for each reoo return a stream of commits
    (0, rxjs_1.mergeMap)((repo) => {
        const commitWithRepoPath = repo.commits.map((commit) => {
            return { commit, repoPath: repo.path };
        });
        return (0, rxjs_1.from)(commitWithRepoPath);
    }), (0, rxjs_1.toArray)(), 
    // sort the commits and store in diffsRemaining the number of commits for which we have to calculate the diffs
    (0, rxjs_1.concatMap)((commitsWithRepo) => {
        diffsRemaining = commitsWithRepo.length;
        // sort commitsWithRepo by commit date ascending
        commitsWithRepo.sort((a, b) => {
            return a.commit.date.getTime() - b.commit.date.getTime();
        });
        return (0, rxjs_1.from)(commitsWithRepo);
    }), (0, rxjs_1.mergeMap)(({ commit, repoPath }) => {
        return (0, commit_cloc_diff_function_1.calculateClocGitDiffsChildParent)(commit, repoPath, languages).pipe((0, rxjs_1.tap)((stat) => {
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
const writeClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)]).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, statsToCsv(stats)).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function statsToCsv(reposStats) {
    const csvRecs = reposStats
        .filter((stat) => !stat.clocDiff.error)
        .map((stat) => flattenClocDiffStat(stat))
        .flat();
    return (0, to_csv_1.toCsv)(csvRecs);
}
function flattenClocDiffStat(stat) {
    const remoteOriginUrl = stat.remoteOriginUrl;
    const repoPath = stat.repoPath;
    const yearMonth = stat.yearMonth;
    const clocDiffStat = stat.clocDiff;
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const mostRecentCommitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${clocDiffStat.mostRecentCommitSha}`;
    const base = {
        remoteOriginUrl,
        repoPath,
        yearMonth,
        leastRecentCommitDate: stat.leastRecentCommitDate,
        mostRecentCommitDate: stat.mostRecentCommitDate,
        leastRecentCommit: clocDiffStat.leastRecentCommitSha,
        mostRecentCommit: clocDiffStat.mostRecentCommitSha,
        mostRecentCommitUrl,
    };
    return (0, cloc_diff_stat_csv_1.clocDiffStatToCsvWithBase)(clocDiffStat.diffs, base, repoPath, clocDiffStat.leastRecentCommitSha, clocDiffStat.mostRecentCommitSha);
}
//# sourceMappingURL=cloc-turnover.functions.js.map