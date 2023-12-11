import { Command } from "commander";
import { fetchAllRepos$ } from "../../git-functions/repo";

export function launchFetchRepos() {
    console.log('====>>>> Launching Fetch Repos')

    const { folderPath } = readParams();

    fetchAllRepos$(folderPath).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description('A command to fetch the git repos contained in a folder')
        .requiredOption(
            '--folderPath <string>',
            `folder containing the repos to fetch (e.g. ./repos)`,
        );

    const _options = program.parse(process.argv).opts();

    return { folderPath: _options.folderPath };
}
