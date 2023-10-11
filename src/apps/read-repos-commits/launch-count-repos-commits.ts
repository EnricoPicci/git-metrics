import { Command } from "commander";
import { readReposCommits } from "./internals/read-repos-commits";

export function launchCountReposCommits() {
    console.log('====>>>> Launching Count Repos Commits')

    const { folderPath, outdir } = readParams();

    readReposCommits(folderPath, outdir).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description('A command to analyze the commits of a set of repos contained in a folder')
        .requiredOption(
            '--folderPath <string>',
            `folder containing the repos to analyze (e.g. ./repos)`,
        )
        .option(
            '--outdir <string>',
            `directory where the output files will be written (e.g. ./data) - default is the current directory`,
        );

    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();

    return { folderPath: _options.folderPath, outdir };
}
