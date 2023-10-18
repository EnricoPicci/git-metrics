import { Command } from "commander";
import { writeClocDiffWithCommit$ } from "../../git-cloc-functions/cloc-diff-commit";


export function launchClocDiffByfileWithCommit() {
    console.log('====>>>> Launching Cloc Diff Byfile with Commit For Repo')

    const { folderPath, outdir, from, to, languages } = readParams();
    writeClocDiffWithCommit$(folderPath, outdir, from, to, languages).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description(`A command to run the cloc diff command on a git repo(for each file change between a commit and its parent) 
        and write the output to a csv file. A time range can be given to filter the commits to be analyzed.`)
        .requiredOption(
            '--folderPath <string>',
            `folder containing the repo to analyze (e.g. ./my-repo)`,
        )
        .option(
            '--outdir <string>',
            `directory where the output files will be written (e.g. ./data) - default is the current directory`,
        )
        .option(
            '--from <string>',
            `the date from which we start the analysis - default is the beginning of the Unix epoch, i.e. 1970-01-01`,
        )
        .option('--to <string>', `the date until which we run the analysis - default is the current date`)
        .option(
            '--languages <string...>',
            `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`,
        );

    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const from = _options.from ? new Date(_options.from) : new Date(0);
    const to = _options.to ? new Date(_options.to) : new Date(Date.now());
    const languages = _options.languages || [];

    return { folderPath: _options.folderPath, outdir, from, to, languages };
}