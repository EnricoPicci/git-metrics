"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchRunRepoCouplingReport = void 0;
const commander_1 = require("commander");
const read_git_1 = require("../1-A-read/read-git");
const run_repo_coupling_report_core_1 = require("./internals/run-repo-coupling-report-core");
function launchRunRepoCouplingReport() {
    var _a;
    const program = new commander_1.Command();
    program
        .description('A command to read a git repo and launch the REPO COUPLING REPORT')
        .requiredOption('-r, --repoFolderPaths <string...>', `path to the folders containing the repos which we want to analize for coupling ('path_1' 'path_2')`)
        .option('-t, --timeWindowDays <number>', `lenght of the time window in days, defualt is 1`, '1')
        .option('--csvFilePath <string>', `path of the csv file built (default is repo-coupling.csv in the outDir folder)`)
        .option('-f, --filter <string...>', `optional filter to be used (e.g. '*.ts*' to select typescript files - make sure the filter is between single quotes)`)
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-d, --outDir <string>', `folder where the log file created by git log command will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
        .option('-o, --outFile <string>', `name of the log file written (default is the name of the repo)`)
        .option('--outClocFile <string>', 'log file containing the cloc info (default is the name of the repo with -cloc postfix)')
        .option('--clocDefsFile <string>', `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`);
    program.parse(process.argv);
    const _options = program.opts();
    const _timeWindowLengthInDays = program.opts().timeWindowDays ? parseInt(program.opts().timeWindowDays) : 1;
    const _csvFilePath = (_a = _options.csvFilePath) !== null && _a !== void 0 ? _a : `${_options.outDir}/repo-coupling.csv`;
    (0, run_repo_coupling_report_core_1.runRepoCouplingReport)(_options.repoFolderPaths, _timeWindowLengthInDays, _csvFilePath, _options.filter, _options.after, _options.outDir, _options.outFile, _options.outClocFile).subscribe({
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
exports.launchRunRepoCouplingReport = launchRunRepoCouplingReport;
//# sourceMappingURL=run-repo-coupling-report.js.map