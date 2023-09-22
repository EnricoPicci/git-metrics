import { Command } from "commander";
import { calculateClocOnRepos } from "./internals/cloc-repos";


export function launchClocRepos() {
    console.log('====>>>> Launching Cloc on Repos')

    const { folderPath, outdir } = readParams();

    calculateClocOnRepos(folderPath, outdir).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
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