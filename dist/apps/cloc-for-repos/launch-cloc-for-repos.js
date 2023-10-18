"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocForRepos = void 0;
const commander_1 = require("commander");
const cloc_1 = require("../../cloc-functions/cloc");
function launchClocForRepos() {
    console.log('====>>>> Launching Cloc For Repos');
    const { folderPath, outdir } = readParams();
    (0, cloc_1.writeClocByFileForRepos$)(folderPath, outdir).subscribe();
}
exports.launchClocForRepos = launchClocForRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to run the cloc command (which counts lines of code) for a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { folderPath: _options.folderPath, outdir };
}
//# sourceMappingURL=launch-cloc-for-repos.js.map