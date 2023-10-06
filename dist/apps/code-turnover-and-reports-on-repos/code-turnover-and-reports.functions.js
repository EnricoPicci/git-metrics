"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsAndCodeTurnover = void 0;
const rxjs_1 = require("rxjs");
const config_1 = require("../../config");
const repo_functions_1 = require("../../git-functions/repo.functions");
const run_reports_on_repo_core_1 = require("../reports-on-repo/2-pipelines/internals/run-reports-on-repo-core");
const code_turnover_functions_1 = require("../code-turnover/core/code-turnover.functions");
const path_1 = __importDefault(require("path"));
function reportsAndCodeTurnover(folderPath, fromDate, toDate, outdir, _languages, concurrency = config_1.CONFIG.CONCURRENCY, excludeRepoPaths = [], reports, filter, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repo_functions_1.reposCompactInFolderObs)(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe((0, rxjs_1.mergeMap)((repo) => {
        return (0, run_reports_on_repo_core_1.runReportsParallelReads)(reports, repo.path, filter, fromDate, toDate, outdir, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero, 0).pipe((0, rxjs_1.map)((reports) => {
            return {
                repo,
                summaryReportPath: reports.summaryReportPath,
            };
        }));
    }, 1), (0, rxjs_1.concatMap)(({ repo, summaryReportPath }) => {
        return (0, code_turnover_functions_1.calculateCodeTurnover)(repo.path, outdir, _languages, fromDate, toDate, concurrency, excludeRepoPaths).pipe((0, rxjs_1.map)(stats => {
            return stats.map(stat => {
                const statWithSummary = Object.assign(Object.assign({}, stat), { summaryReportPath });
                return statWithSummary;
            });
        }));
    }), (0, code_turnover_functions_1.writeClocDiffsJson)(outdir, folderName), (0, code_turnover_functions_1.writeClocDiffsCsv)(outdir, folderName));
}
exports.reportsAndCodeTurnover = reportsAndCodeTurnover;
//# sourceMappingURL=code-turnover-and-reports.functions.js.map