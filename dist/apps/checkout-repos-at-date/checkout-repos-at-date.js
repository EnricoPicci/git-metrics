"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutAllReposAtDate = void 0;
const commander_1 = require("commander");
const repo_1 = require("../../git-functions/repo");
function checkoutAllReposAtDate() {
    console.log('====>>>> Launching Checkout Repos At Date');
    const { folderPath, outDir, date } = readParams();
    const cmdExecutedLog = [];
    const cmdErroredLog = [];
    const options = { outDir, cmdExecutedLog, cmdErroredLog };
    (0, repo_1.checkoutAllReposAtDate$)(folderPath, date, options).subscribe();
}
exports.checkoutAllReposAtDate = checkoutAllReposAtDate;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to check out a set of repos at a specific date')
        .requiredOption('--folderPath <string>', `folder containing the repos to checkout (e.g. ./repos)`)
        .option('--date <string>', `the date at which to checkout the repos (e.g. 2021-01-01) - default is the current date. If no commits
            are found for the specified date, the checkout will be done at the last commit before the specified date.`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outDir = _options.outdir || process.cwd();
    const date = _options.date ? new Date(_options.date) : new Date(0);
    return { folderPath: _options.folderPath, outDir, date };
}
//# sourceMappingURL=checkout-repos-at-date.js.map