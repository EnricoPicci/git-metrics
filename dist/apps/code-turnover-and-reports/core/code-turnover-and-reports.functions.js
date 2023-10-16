"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsAndCodeTurnover = void 0;
const rxjs_1 = require("rxjs");
const config_1 = require("../../../config");
const code_turnover_functions_1 = require("../../code-turnover/core/code-turnover.functions");
const language_extensions_dict_1 = require("./language-extensions-dict");
const run_reports_on_merged_repos_core_1 = require("../../reports-on-repo/2-pipelines/internals/run-reports-on-merged-repos-core");
/**
 * Generates the reports for a folder containing multiple Git repositories and calculates the code turnover for all repos
 * contained in the folder.
 * The function returns an Observable that emits an array of `CommitDiffStatsWithSummaryReport`
 * objects representing the cloc diffs and summary reports for each commit in each repository.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param fromDate The start date for the cloc diffs and reports.
 * @param toDate The end date for the cloc diffs and reports.
 * @param outdir The path to the folder where the output should be saved.
 * @param languages An array of languages for which to calculate the cloc diffs.
 * @param concurrency The maximum number of concurrent child processes to run. Defaults to the value of `CONFIG.CONCURRENCY`.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation.
 * @param reports An array of report types to generate.
 * @param filter An array of file filters to apply to the reports.
 * @param outFilePrefix A prefix to add to the output file names.
 * @param clocDefsPath The path to the cloc definitions file.
 * @param concurrentReadOfCommits Whether to read the commits concurrently.
 * @param noRenames Whether to ignore file renames.
 * @param ignoreClocZero Whether to ignore files with zero lines of code.
 * @returns An Observable that emits an array of `CommitDiffStatsWithSummaryReport` objects representing the cloc diffs and summary reports for each commit in each repository.
 */
function reportsAndCodeTurnover(folderPath, fromDate, toDate, outdir, languages, concurrency = config_1.CONFIG.CONCURRENCY, excludeRepoPaths = [], reports, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero, removeBlanks, removeNFiles, removeComments, removeSame) {
    const filter = (0, language_extensions_dict_1.languageExtensions)(languages);
    const reportOnAllRepos$ = (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(reports, folderPath, filter, fromDate, toDate, outdir, outFilePrefix, clocDefsPath, ignoreClocZero, 0, concurrentReadOfCommits, noRenames, excludeRepoPaths);
    const options = { languages, removeBlanks, removeNFiles, removeComments, removeSame };
    const calculateCodeTurnover$ = (0, code_turnover_functions_1.calculateCodeTurnover)(folderPath, outdir, fromDate, toDate, concurrency, excludeRepoPaths, options);
    return (0, rxjs_1.concat)(reportOnAllRepos$, calculateCodeTurnover$);
}
exports.reportsAndCodeTurnover = reportsAndCodeTurnover;
//# sourceMappingURL=code-turnover-and-reports.functions.js.map