"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchBranchesReport = void 0;
const commander_1 = require("commander");
const read_git_1 = require("../reports-on-repos/1-A-read/read-git");
const run_branches_report_core_1 = require("./internals/run-branches-report-core");
function launchBranchesReport() {
    const program = new commander_1.Command();
    program
        .description('A command to read a git repo and then run all the reports')
        .option('-r, --repoFolderPath <string>', 'path to the folder containing the repo (the current folder name is the default)', `${process.cwd()}`)
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-d, --outDir <string>', `folder where the log file created by git log command will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
        .option('-o, --outFilePrefix <string>', `the prefix of the name of the log file written as result of creating a report (default is the name of the repo)`)
        .option('--clocDefsFile <string>', `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`)
        .option('--depthInFilesCoupling <string>', `if we sort the files for number of commits, we consider for coupling only the ones with more commits, i.e. the ones which remain within depthInFilesCoupling (default value is 10)`, `10`)
        .option('-c, --concurrentReadOfCommits', `if this opion is specified, then the file containing the commit records is read concurrently in the processing of all reports, this can reduce the memory consumption`)
        .option('--noRenames', `if this opion is specified, then the no-renames option is used in the git log command`);
    program.parse(process.argv);
    const _options = program.opts();
    const _repoFolderPath = _options.repoFolderPath ? _options.repoFolderPath : process.cwd();
    (0, run_branches_report_core_1.runBranchesReport)(_repoFolderPath, _options.after, _options.outDir, _options.outFilePrefix, _options.clocDefsFile, _options.noRenames).subscribe({
        next: (report) => {
            console.log('\n', '\n');
            report.considerations.forEach((l) => {
                console.log(l);
            });
        },
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
exports.launchBranchesReport = launchBranchesReport;
//# sourceMappingURL=run-branches-report.js.map