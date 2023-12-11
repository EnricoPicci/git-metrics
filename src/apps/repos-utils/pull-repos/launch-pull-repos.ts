import { Command } from "commander";
import { pullAllRepos$ } from "../../../git-functions/repo";

export function launchPullRepos() {
    console.log('====>>>> Launching Pull Repos')

    const { folderPath, excludeRepoPaths } = readParams();

    pullAllRepos$(folderPath, 1, excludeRepoPaths).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description('A command to pulls the git repos contained in a folder')
        .requiredOption(
            '--folderPath <string>',
            `folder containing the repos to pull (e.g. ./repos)`,
        )
        .option(
            '--excludeRepoPaths <string...>',
            `a space separated list of folder names to be excluded from the pull action (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`,
        );

    const _options = program.parse(process.argv).opts();
    const excludeRepoPaths = _options.excludeRepoPaths || [];

    return { folderPath: _options.folderPath, excludeRepoPaths };
}
