"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchPullRepos = void 0;
const commander_1 = require("commander");
const repo_1 = require("../../../git-functions/repo");
function launchPullRepos() {
    console.log('====>>>> Launching Pull Repos');
    const { folderPath, excludeRepoPaths } = readParams();
    (0, repo_1.pullAllRepos$)(folderPath, 1, excludeRepoPaths).subscribe();
}
exports.launchPullRepos = launchPullRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to pulls the git repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to pull (e.g. ./repos)`)
        .option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the pull action (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`);
    const _options = program.parse(process.argv).opts();
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    return { folderPath: _options.folderPath, excludeRepoPaths };
}
//# sourceMappingURL=launch-pull-repos.js.map