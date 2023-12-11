"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchPullRepos = void 0;
const commander_1 = require("commander");
const repo_1 = require("../../../git-functions/repo");
function launchPullRepos() {
    console.log('====>>>> Launching Pull Repos');
    const { folderPath } = readParams();
    (0, repo_1.pullAllRepos$)(folderPath).subscribe();
}
exports.launchPullRepos = launchPullRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to fetch the git repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to fetch (e.g. ./repos)`);
    const _options = program.parse(process.argv).opts();
    return { folderPath: _options.folderPath };
}
//# sourceMappingURL=pull-repos.js.map