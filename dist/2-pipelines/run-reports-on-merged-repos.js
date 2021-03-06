"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchAllReportsOnMergedRepos = void 0;
const commander_1 = require("commander");
const read_git_1 = require("../1-A-read/read-git");
const run_reports_on_merged_repos_core_1 = require("./internals/run-reports-on-merged-repos-core");
const run_reports_on_repo_core_1 = require("./internals/run-reports-on-repo-core");
function launchAllReportsOnMergedRepos() {
    var _a;
    const program = new commander_1.Command();
    program
        .description('A command to read an array of git repos, merge all the commit information and then run all the reports')
        .option('--reports <string...>', `reports to be run (the default is all reports: ${run_reports_on_repo_core_1.allReports.join(' ')}) - report names have to be specified with single
quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'`)
        .option('-r, --repoFolderPath <string>', `path to the folder containing the folders with the repos we want to merge, if no value is provided then the repos in the subfolders of the current folder will be analyzed`)
        .option('-f, --filter <string...>', `optional filter to be used (e.g. '*.ts*' to select typescript files - make sure the filer is between single quotes)`)
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-b, --before <string>', `date to end (format YYYY-MM-DD)`)
        .option('-d, --outDir <string>', `folder where the log file created by git log command will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
        .option('-o, --outFilePrefix <string>', `the prefix of the name of the log file written as result of creating a report (default is the name of the repo)`)
        .option('--clocDefsFile <string>', `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`)
        .option('--depthInFilesCoupling <string>', `if we sort the files for number of commits, we consider for coupling only the ones with more commits, i.e. the ones which remain within depthInFilesCoupling (default value is 10)`, `10`)
        .option('-c, --concurrentReadOfCommits', `if this opion is specified, then the file containing the commit records is read concurrently in the processing of all reports, this can reduce the memory consumption`)
        .option('--noRenames', `if this opion is specified, then the no-renames option is used in the git log command`);
    program.parse(process.argv);
    const _options = program.opts();
    const _reports = (_a = _options.reports) !== null && _a !== void 0 ? _a : run_reports_on_repo_core_1.allReports;
    const _repoFolderPath = _options.repoFolderPath ? _options.repoFolderPath : process.cwd();
    const _depthInFilesCoupling = parseInt(_options.depthInFilesCoupling);
    (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(_reports, _repoFolderPath, _options.filter, _options.after, _options.before, _options.outDir, _options.outFilePrefix, _options.clocDefsFile, _depthInFilesCoupling, _options.concurrentReadOfCommits, _options.noRenames).subscribe({
        next: (reports) => {
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