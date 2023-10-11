"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchAllReportsOnMergedRepos = void 0;
const commander_1 = require("commander");
const run_reports_on_merged_repos_core_1 = require("./internals/run-reports-on-merged-repos-core");
const run_reports_on_repo_core_1 = require("./internals/run-reports-on-repo-core");
const DEFAULT_OUT_DIR = './';
function launchAllReportsOnMergedRepos() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const program = new commander_1.Command();
    program
        .description('A command to read an array of git repos, merge all the commit information and then run all the reports')
        .option('--reports <string...>', `reports to be run (the default is all reports: ${run_reports_on_repo_core_1.allReports.join(' ')}) - report names have to be specified with single
quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'`)
        .option('-r, --repoFolderPath <string>', `path to the folder containing the folders with the repos we want to merge, if no value is provided then the repos in the subfolders of the current folder will be analyzed`)
        .option('-f, --filter <string...>', `optional filter to be used (e.g. '*.ts*' to select typescript files - make sure the filter is between single quotes)`)
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-b, --before <string>', `date to end (format YYYY-MM-DD)`)
        .option('-d, --outDir <string>', `folder where the log file created by git log command will be written (default ${DEFAULT_OUT_DIR})`, `${DEFAULT_OUT_DIR}`)
        .option('-o, --outFilePrefix <string>', `the prefix of the name of the log file written as result of creating a report (default is the name of the repo)`)
        .option('--clocDefsFile <string>', `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`)
        .option('--depthInFilesCoupling <string>', `if we sort the files for number of commits, we consider for coupling only the ones with more commits, i.e. the ones which remain within depthInFilesCoupling (default value is 10)`, `10`)
        .option('-c, --concurrentReadOfCommits', `if this opion is specified, then the file containing the commit records is read concurrently in the processing of all reports, this can reduce the memory consumption`)
        .option('--noRenames', `if this opion is specified, then the no-renames option is used in the git log command`)
        .option('--countClocZero', `if this opion is specified, then also the files that have 0 lines of code are counted (this can 
            be the case for files have been deleted or renamed in the past but are still present in the repo referenced by old commits)`)
        .option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`);
    program.parse(process.argv);
    const _options = program.opts();
    const _reports = (_a = _options.reports) !== null && _a !== void 0 ? _a : run_reports_on_repo_core_1.allReports;
    const _repoFolderPath = _options.repoFolderPath ? _options.repoFolderPath : process.cwd();
    const _filter = (_b = _options.filter) !== null && _b !== void 0 ? _b : [];
    const _after = _options.after ? new Date(_options.after) : new Date('1970-01-01');
    const _before = _options.before ? new Date(_options.before) : new Date('2100-01-01');
    const _outDir = (_c = _options.outDir) !== null && _c !== void 0 ? _c : DEFAULT_OUT_DIR;
    const _outFilePrefix = (_d = _options.outFilePrefix) !== null && _d !== void 0 ? _d : '';
    const _clocDefsFile = (_e = _options.clocDefsFile) !== null && _e !== void 0 ? _e : '';
    const _ignoreClocZero = !_options.countClocZero;
    const _depthInFilesCoupling = _options.depthInFilesCoupling ? parseInt(_options.depthInFilesCoupling) : 10;
    const _concurrentReadOfCommits = (_f = _options.concurrentReadOfCommits) !== null && _f !== void 0 ? _f : false;
    const _noRenames = (_g = _options.noRenames) !== null && _g !== void 0 ? _g : false;
    const _excludeRepoPaths = (_h = _options.excludeRepoPaths) !== null && _h !== void 0 ? _h : [];
    (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(_reports, _repoFolderPath, _filter, _after, _before, _outDir, _outFilePrefix, _clocDefsFile, _ignoreClocZero, _depthInFilesCoupling, _concurrentReadOfCommits, _noRenames, _excludeRepoPaths).subscribe({
        next: ({ reports }) => {
            reports.forEach((report) => {
                console.log('\n', '\n');
                report.considerations.forEach((l) => {
                    console.log(l);
                });
            });
        },
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
exports.launchAllReportsOnMergedRepos = launchAllReportsOnMergedRepos;
//# sourceMappingURL=run-reports-on-merged-repos.js.map