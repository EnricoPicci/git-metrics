import { Command } from "commander";
import { WriteCodeTurnoverOptions } from "../../git-cloc-functions/cloc-diff-commit";
import { codeTurnover$ } from "../../git-cloc-functions/code-turnover";

export function launchCodeTurnoverForRepos() {
    const start = Date.now();

    console.log('====>>>> Launching code-turnover For Repos')

    const { folderPath, outdir, fromDate, toDate, excludeRepoPaths, languages,
        removeBlanks, removeComments, removeSame, fileMassiveRefactorThreshold, commitMassiveRefactorThreshold,
        commitMassiveRemoveThreshold, jiraIdRegexPattern, creationDateCsvFilePath, notMatchDirectories } = readParams();

    const options: WriteCodeTurnoverOptions = {
        outdir,
        fromDate,
        toDate,
        excludeRepoPaths,
        languages,
        removeBlanks,
        removeComments,
        removeSame,
        fileMassiveRefactorThreshold,
        commitMassiveRefactorThreshold,
        commitMassiveRemoveThreshold,
        jiraIdRegexPattern,
        creationDateCsvFilePath,
        notMatchDirectories
    }

    codeTurnover$(folderPath, options).subscribe({
        complete: () => {
            console.log(`\nCode turnover (i.e. Cloc Diff Byfile with Commit For Repo) calculation completed in ${(Date.now() - start) / 1000} seconds`);
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
            `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") - default is the empty list which means no repos are excluded wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`,
        )
        .option(
            '--languages <string...>',
            `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
- default is the empty list which means all languages`,
        )
        .option(
            '--removeBlanks',
            `if this opion is specified, then the statistics about blank lines are removed from the cloc diff output`,
        )
        .option(
            '--removeComments',
            `if this opion is specified, the statistics about comment lines are removed from the cloc diff output`,
        )
        .option(
            '--removeSame',
            `if this opion is specified, the statistics about lines that are the same (i.e. unchanged) are removed from the cloc diff output`,
        )
        .option(
            '--fileMassiveRefactorThreshold <number>',
            `if this opion is specified, the flag to indicate whether a file diff is likely derived from a massive refactoring will be calculated (the logic being that a diff on a file with a code turnover higher than the threshold is likely to be a massive refactoring)`,
        )
        .option(
            '--commitMassiveRefactorThreshold <number>',
            `if this opion is specified, the flag to indicate whether a file diff is likely derived from a massive refactoring will be calculated (the logic being that a diff belonging to a commit whose code-turnover higher than the threshold is likely to be a massive refactoring)`,
        )
        .option(
            '--commitMassiveRemoveThreshold <number>',
            `if this opion is specified, the flag to indicate whether a file diff is likely derived from a massive removal will be calculated (the logic being that a diff belonging to a commit whose code-turnover is mainly a massive removal can be filtered out from the code turnover analysis)`,
        )
        .option(
            '--jiraIdRegexPattern <string>',
            `regex to extract the Jira ID from the commit subject (e.g. "[A-Za-z]+-\\d+|\\[[A-Za-z]+ \\d+\\]|[A-Za-z]+ +- \\d" will extract Jira IDs of the form "XXXX-1234" or "[XXXX 1234]" or "XXXX - 1234")`,
        )
        .option(
            '--creationDateCsvFilePath <string>',
            `the path to a csv file that contains the date of the creation of the repos - if this date is subsequent to the start date of the analysis (contained in the from parameter), then the creation date is used as the start date this is useful in case of forked repos - if we want to analyze the code turnover of a forked repo, we may want to consider the code turnover only after the fork date the csv file must have the following fields: 
- either 'http_url_to_repo' or 'ssh_url_to_repo' or both: the url to the repo on the "origin" git server which represents the key of the repo
- created_at: the date of creation of the repo`,
        )
        .option(
            '--notMatchDirectories <string...>',
            `a space separated list of regular expression that are evaluated against the directories of the files in the commit (e.g. --notMatchDirectories "node_modules"). If the regular expression is matched, the file excluded.`,
        );

    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const fromDate = _options.from ? new Date(_options.from) : new Date(0);
    const toDate = _options.to ? new Date(_options.to) : new Date(Date.now());
    const excludeRepoPaths = _options.excludeRepoPaths || [];
    const languages = _options.languages || [];
    const removeBlanks = _options.removeBlanks || false;
    const removeComments = _options.removeComments || false;
    const removeSame = _options.removeSame || false;
    const fileMassiveRefactorThreshold = _options.fileMassiveRefactorThreshold || 0;
    const commitMassiveRefactorThreshold = _options.commitMassiveRefactorThreshold || 0;
    const commitMassiveRemoveThreshold = _options.commitMassiveRemoveThreshold || 0.9;
    const jiraIdRegexPattern = _options.jiraIdRegexPattern || '';
    const creationDateCsvFilePath = _options.creationDateCsvFilePath || '';
    const notMatchDirectories = _options.notMatchDirectories || [];

    return {
        folderPath: _options.folderPath, outdir, fromDate, toDate, excludeRepoPaths, languages,
        removeBlanks, removeComments, removeSame, fileMassiveRefactorThreshold, commitMassiveRefactorThreshold,
        commitMassiveRemoveThreshold, jiraIdRegexPattern, creationDateCsvFilePath, notMatchDirectories
    };
}