"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchReadReposCommits = void 0;
const commander_1 = require("commander");
const read_repos_commits_1 = require("./internals/read-repos-commits");
function launchReadReposCommits() {
    console.log('====>>>> Launching Read Repos Commits');
    const { folderPath, outdir } = readParams();
    (0, read_repos_commits_1.readReposCommits)(folderPath, outdir).subscribe();
}
exports.launchReadReposCommits = launchReadReposCommits;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to analyze the commits of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { folderPath: _options.folderPath, outdir };
}
//# sourceMappingURL=launch-count-repos-commits.js.map