"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateClocOnRepos = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const config_1 = require("../../../config");
const repo_cloc_functions_1 = require("../../../git-functions/repo-cloc.functions");
// calculateClocOnRepos is a function that calculates the cloc on the repos contained in a folder
// and write the results as a json file and as a csv file
function calculateClocOnRepos(folderPath, outdir, concurrency = config_1.CONFIG.CONCURRENCY) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repo_cloc_functions_1.clocOnRepos)(folderPath, concurrency).pipe((0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc.json`);
        return writeClocJson(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc.csv`);
        return writeClocCsv(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }));
}
exports.calculateClocOnRepos = calculateClocOnRepos;
const writeClocJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, statsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function statsToCsv(stats) {
    const csvRecs = stats.map((stat) => {
        const repoPath = stat.repoPath;
        const clocStats = stat.clocStats;
        return clocStats.map((clocStat) => {
            return Object.assign({ repoPath }, clocStat);
        });
    }).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
//# sourceMappingURL=cloc-repos.js.map