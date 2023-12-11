"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchFetchRepos = void 0;
const commander_1 = require("commander");
const repo_1 = require("../../../git-functions/repo");
function launchFetchRepos() {
    console.log('====>>>> Launching Fetch Repos');
    const { folderPath, excludeRepoPaths } = readParams();
    (0, repo_1.fetchAllRepos$)(folderPath, 1, excludeRepoPaths).subscribe();
}
exports.launchFetchRepos = launchFetchRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to fetch the git repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to fetch (e.g. ./repos)`)
        .option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`);
    const _options = program.parse(process.argv).opts();
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    return { folderPath: _options.folderPath, excludeRepoPaths };
}
//# sourceMappingURL=launch-fetch-repos.js.map