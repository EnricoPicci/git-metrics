"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readReposCommits = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const repos_with_commits_by_month_functions_1 = require("../../cloc-diff-repos/internals/repos-with-commits-by-month.functions");
// readReposCommits reeads all the repos contained in a directory and returns an observable of an array of RepoCompact
function readReposCommits(folderPath, outdir, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repos_with_commits_by_month_functions_1.reposCompactWithCommitsByMonthsInFolderObs)(folderPath, fromDate, toDate, concurrency).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((repos) => {
        const outFile = path_1.default.join(outdir, `${folderName}.json`);
        return writeReposJson(repos, outFile);
    }), (0, rxjs_1.concatMap)((repos) => {
        const outFile = path_1.default.join(outdir, `${folderName}-repos-commits-by-month.json`);
        const repoCommitsByMonth = (0, repos_with_commits_by_month_functions_1.newReposWithCommitsByMonth)(repos);
        return writeReposCommitsByMonthJson(repoCommitsByMonth, outFile);
    }), (0, rxjs_1.concatMap)((repoCommitsByMonth) => {
        const outFile = path_1.default.join(outdir, `${folderName}-repos-commits-by-month.csv`);
        return writeReposCommitsByMonthCsv(repoCommitsByMonth, outFile);
    }));
}
exports.readReposCommits = readReposCommits;
const writeReposJson = (repos, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [
        // add a replacer function since JSON.stringify does not support Set
        // https://stackoverflow.com/a/46491780/5699993
        JSON.stringify(repos, (_key, value) => (value instanceof Set ? [...value] : value), 2),
    ]).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Repos info written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => repos));
};
const writeReposCommitsByMonthJson = (repoCommitsByMonth, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(repoCommitsByMonth, null, 2)]).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Repos commits by month info written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => repoCommitsByMonth));
};
const writeReposCommitsByMonthCsv = (repoCommitsByMonth, outFile) => {
    const repoCommitsByMonthRecs = (0, repos_with_commits_by_month_functions_1.repoCommitsByMonthRecords)(repoCommitsByMonth);
    const repoCommitsByMonthCsvs = (0, csv_tools_1.toCsv)(repoCommitsByMonthRecs);
    return (0, observable_fs_1.writeFileObs)(outFile, repoCommitsByMonthCsvs).pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Repos commits by month csv records written in file: ${outFile}`),
    }));
};
//# sourceMappingURL=read-repos-commits.js.map