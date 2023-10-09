"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchRunReportsAndCodeTurnover = void 0;
const commander_1 = require("commander");
const rxjs_1 = require("rxjs");
const config_1 = require("../../config");
const run_reports_on_repo_core_1 = require("../reports-on-repo/2-pipelines/internals/run-reports-on-repo-core");
const cloc_repos_1 = require("../cloc-on-repos/cloc-repos/internals/cloc-repos");
const code_turnover_and_reports_functions_1 = require("./core/code-turnover-and-reports.functions");
function launchRunReportsAndCodeTurnover() {
    const start = Date.now();
    console.log('====>>>> Launching run-reports and code-turnover calculation on Repos');
    const { folderPath, fromDate, toDate, outdir, languages, concurrency, excludeRepoPaths, reports, outFilePrefix, concurrentReadOfCommits, noRenames, countClocZero, removeBlanks, removeNFiles, removeComments, removeSame } = readParams();
    const cloc$ = (0, cloc_repos_1.calculateClocOnRepos)(folderPath, outdir, concurrency);
    // const reportOnAllRepos$ = runAllReportsOnMergedRepos(allReports, folderPath, [], fromDate, toDate, outdir, outFilePrefix, '', false, 0, false, false)
    const reportsAndCodeTurnover$ = (0, code_turnover_and_reports_functions_1.reportsAndCodeTurnover)(folderPath, fromDate, toDate, outdir, languages, concurrency, excludeRepoPaths, reports, outFilePrefix, '', // we ignore the possibility to use a custom cloc definition file
    concurrentReadOfCommits, noRenames, !countClocZero, removeBlanks, removeNFiles, removeComments, removeSame);
    (0, rxjs_1.concat)(cloc$, reportsAndCodeTurnover$).subscribe({
        complete: () => {
            console.log(`====>>>> run-reports and code-turnover calculation on Repos completed in ${(Date.now() - start) / 1000} seconds`);
        },
    });
}
exports.launchRunReportsAndCodeTurnover = launchRunReportsAndCodeTurnover;
function readParams() {
    var _a;
    const program = new commander_1.Command();
    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`)
        .option('--languages <string...>', `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`)
        .option('--from <string>', `the date from which we start the analysis - default is the beginning of the Unix epoch, i.e. 1970-01-01`)
        .option('--to <string>', `the date until which we run the analysis - default is the current date`)
        .option('--concurrency <number>', `concurrency level - default is ${config_1.CONFIG.CONCURRENCY}`)
        .option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`)
        .option('--reports <string...>', `reports to be run (the default is all reports: ${run_reports_on_repo_core_1.allReports.join(' ')}) - report names have to be specified with single
quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'`)
        .option('-o, --outFilePrefix <string>', `the prefix of the name of the log file written as result of creating a report (default is the name of the repo)`)
        .option('-c, --concurrentReadOfCommits', `if this opion is specified, then the file containing the commit records is read concurrently in the processing of all reports, this can reduce the memory consumption`)
        .option('--noRenames', `if this opion is specified, then the no-renames option is used in the git log command`)
        .option('--countClocZero', `if this opion is specified, then also the files that have 0 lines of code are counted (this can 
            be the case for files have been deleted or renamed in the past but are still present in the repo referenced by old commits)`)
        .option('--removeBlanks', `if this opion is specified, then the statistics about blank lines are removed from the cloc diff output`)
        .option('--removeNFiles', `if this opion is specified, then the statistics about number of files changed are removed from the cloc diff output`)
        .option('--removeComments', `if this opion is specified, the statistics about comment lines are removed from the cloc diff output`)
        .option('--removeSame', `if this opion is specified, the statistics about lines that are the same (i.e. unchanged) are removed from the cloc diff output`);
    const _options = program.parse(process.argv).opts();
    const fromDate = _options.from ? new Date(_options.from) : new Date(0);
    const toDate = _options.to ? new Date(_options.to) : new Date(Date.now());
    const outdir = _options.outdir || process.cwd();
    const languages = _options.languages || [];
    const concurrency = _options.concurrency ? parseInt(_options.concurrency) : config_1.CONFIG.CONCURRENCY;
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    const reports = (_a = _options.reports) !== null && _a !== void 0 ? _a : run_reports_on_repo_core_1.allReports;
    const outFilePrefix = _options.outFilePrefix;
    const concurrentReadOfCommits = _options.concurrentReadOfCommits;
    const noRenames = _options.noRenames;
    const countClocZero = _options.countClocZero;
    const removeBlanks = _options.removeBlanks;
    const removeNFiles = _options.removeNFiles;
    const removeComments = _options.removeComments;
    const removeSame = _options.removeSame;
    return {
        folderPath: _options.folderPath, fromDate, toDate, outdir, languages, concurrency, excludeRepoPaths,
        reports, outFilePrefix, concurrentReadOfCommits, noRenames, countClocZero, removeBlanks, removeNFiles, removeComments, removeSame
    };
}
//# sourceMappingURL=launch-code-turnover-and-reports.js.map