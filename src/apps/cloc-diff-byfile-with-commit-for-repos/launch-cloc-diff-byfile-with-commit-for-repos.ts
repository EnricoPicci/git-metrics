import { Command } from "commander";
import { writeClocDiffWithCommitForRepos$ } from "../../git-cloc-functions/cloc-diff-commit";

export function launchClocDiffByfileWithCommitForRepos() {
    const start = Date.now();

    console.log('====>>>> Launching Cloc Diff Byfile with Commit For Repos')

    const { folderPath, outdir, from, to, excludeRepoPaths, languages } = readParams();
    writeClocDiffWithCommitForRepos$(folderPath, outdir, from, to, excludeRepoPaths, languages).subscribe({
        complete: () => {
            console.log(`\nCloc Diff Byfile with Commit For Repo calculation completed in ${(Date.now() - start) / 1000} seconds`);
        },
    })
}

function readParams() {
    const program = new Command();

    program
        .description(`A command to run the cloc diff command on git repos contained in a folder.
        For all repos the command calculates each file change between a commit and its parent
        and write the output to a csv file. A time range can be given to filter the commits to be analyzed.
        It is possible to exclude some repos from the analysis by providing a list of repo names to exclude
        (wildcards are allowed).`)
        .requiredOption(
            '--folderPath <string>',
            `folder containing the repos to analyze (e.g. ./my-repos)`,
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
            '--excludeRepoPaths <string...>',
            `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`,
        )
        .option(
            '--languages <string...>',
            `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`,
        );

    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const from = _options.from ? new Date(_options.from) : new Date(0);
    const to = _options.to ? new Date(_options.to) : new Date(Date.now());
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    const languages = _options.languages || [];

    return { folderPath: _options.folderPath, outdir, from, to, excludeRepoPaths, languages };
}