"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchAllReportsOnMultiRepos = void 0;
const commander_1 = require("commander");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const run_reports_on_multi_repos_core_1 = require("./internals/run-reports-on-multi-repos-core");
const run_reports_on_repo_core_1 = require("./internals/run-reports-on-repo-core");
const DEFAULT_OUT_DIR = './';
function launchAllReportsOnMultiRepos() {
    var _a;
    const program = new commander_1.Command();
    program
        .description('A command to read an array of git repos and then run all the reports')
        .option('--reports <string...>', `reports to be run (the default is all reports: ${run_reports_on_repo_core_1.allReports.join(' ')}) - report names have to be specified with single
quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'`)
        .option('-r, --repoFolderPaths <string...>', `path to the folders containing the repos on which we want to run the reports ('path_1' 'path_2'), if no value is provided then the repos in the subfolders of the current folder will be analyzed`)
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
            be the case for files have been deleted or renamed in the past but are still present in the repo referenced by old commits)`);
    program.parse(process.argv);
    const _options = program.opts();
    const _reports = (_a = _options.reports) !== null && _a !== void 0 ? _a : run_reports_on_repo_core_1.allReports;
    const _repoFolderPaths = _options.repoFolderPaths ? (0, rxjs_1.of)(_options.repoFolderPaths) : (0, run_reports_on_multi_repos_core_1.gitRepos)();
    const _depthInFilesCoupling = parseInt(_options.depthInFilesCoupling);
    _repoFolderPaths
        .pipe((0, operators_1.concatMap)((folders) => (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(_reports, folders, _options.filter, _options.after, _options.before, _options.outDir, _options.outFilePrefix, _options.clocDefsFile, !_options.countClocZero, _depthInFilesCoupling, _options.concurrentReadOfCommits, _options.noRenames)))
        .subscribe({
        next: (reportsOnMultiRepos) => {
            reportsOnMultiRepos.forEach(({ reports, repoFolderPath }) => {
                console.log('\n', '\n');
                console.log('************************************************************************************', '\n');
                console.log(`REPORT FOR REPOSITORY  ${repoFolderPath}`, '\n');
                reports.forEach((report) => {
                    console.log('\n', '\n');
                    report.considerations.forEach((l) => {
                        console.log(l);
                    });
                });
            });
        },
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
exports.launchAllReportsOnMultiRepos = launchAllReportsOnMultiRepos;
//# sourceMappingURL=run-reports-on-multi-repos.js.map