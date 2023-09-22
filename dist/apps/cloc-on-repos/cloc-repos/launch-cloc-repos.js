"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocRepos = void 0;
const commander_1 = require("commander");
const cloc_repos_1 = require("./internals/cloc-repos");
function launchClocRepos() {
    console.log('====>>>> Launching Cloc on Repos');
    const { folderPath, outdir } = readParams();
    (0, cloc_repos_1.calculateClocOnRepos)(folderPath, outdir).subscribe();
}
exports.launchClocRepos = launchClocRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { folderPath: _options.folderPath, outdir };
}
//# sourceMappingURL=launch-cloc-repos.js.map