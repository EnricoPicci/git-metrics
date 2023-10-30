import { Command } from 'commander';

import { CONFIG } from '../../config';

import { calculateMonthlyClocDiffsOnRepos } from './core/cloc-monthly-diff-repos';

export function launchMonthlyClocDiffRepos() {
    console.log('====>>>> Launching Monthly Cloc diff on Repos');

    const { folderPath, outdir, languages, from, to } = readParams();

    calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, from, to).subscribe();
}

function readParams() {
    const program = new Command();

    program
        .description('A command to calculate cloc (number of lines of code) of a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option(
            '--outdir <string>',
            `directory where the output files will be written (e.g. ./data) - default is the current directory`,
        )
        .option(
            '--languages <string...>',
            `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
             - default is the empty list which means all languages`,
        )
        .option(
            '--from <string>',
            `the date from which we start the analysis - default is the beginning of the Unix epoch, i.e. 1970-01-01`,
        )
        .option('--to <string>', `the date until which we run the analysis - default is the current date`)
        .option('--concurrency <number>', `concurrency level - default is ${CONFIG.CONCURRENCY}`)
        .option(
            '--excludeRepoPaths <string...>',
            `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`,
        )
        .option(
            '--removeBlanks',
            `if this opion is specified, then the statistics about blank lines are removed from the cloc diff output`,
        )
        .option(
            '--removeNFiles',
            `if this opion is specified, then the statistics about number of files changed are removed from the cloc diff output`,
        )
        .option(
            '--removeComments',
            `if this opion is specified, the statistics about comment lines are removed from the cloc diff output`,
        )
        .option(
            '--removeSame',
            `if this opion is specified, the statistics about lines that are the same (i.e. unchanged) are removed from the cloc diff output`,
        );

    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const languages = _options.languages || [];
    const from = _options.from ? new Date(_options.from) : new Date(0);
    const to = _options.to ? new Date(_options.to) : new Date(Date.now());
    const concurrency = _options.concurrency ? parseInt(_options.concurrency) : CONFIG.CONCURRENCY;
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    const removeBlanks = _options.removeBlanks
    const removeNFiles = _options.removeNFiles
    const removeComments = _options.removeComments
    const removeSame = _options.removeSame

    return {
        folderPath: _options.folderPath, outdir, languages, from, to, concurrency, excludeRepoPaths,
        removeBlanks, removeNFiles, removeComments, removeSame
    };
}
