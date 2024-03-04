"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchDiffBetweenDatesMultiRepos = void 0;
const commander_1 = require("commander");
const cloc_diff_between_dates_1 = require("../../git-cloc-functions/cloc-diff-between-dates");
function launchDiffBetweenDatesMultiRepos() {
    console.log('====>>>> Launching Diff Between Dates For Repos');
    const { folderPath, outDir, fromDate, toDate, languages, creationDateCsvFilePath, excludeRepoPaths } = readParams();
    (0, cloc_diff_between_dates_1.writeClocDiffBetweenDatesForRepos$)(folderPath, fromDate, toDate, outDir, excludeRepoPaths, languages, creationDateCsvFilePath).subscribe();
}
exports.launchDiffBetweenDatesMultiRepos = launchDiffBetweenDatesMultiRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to calculate the differences in a set of repos between 2 dates')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--fromDate <string>', `the date of the first commit to consider (e.g. 2021-01-01) - default is the beginning of time`)
        .option('--toDate <string>', `the date of the last commit to consider (e.g. 2021-12-31) - default is the current date`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`)
        .option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
             default is the empty list which means no repos are excluded
             wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`)
        .option('--languages <string...>', `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
- default is the empty list which means all languages`)
        .option('--creationDateCsvFilePath <string>', `the path to a csv file that contains the date of the creation of the repos - if this date is subsequent to the start date of the analysis (contained in the from parameter), then the creation date is used as the start date this is useful in case of forked repos - if we want to analyze the code turnover of a forked repo, we may want to consider the code turnover only after the fork date the csv file must have the following fields: 
- either 'http_url_to_repo' or 'ssh_url_to_repo' or both: the url to the repo on the "origin" git server which represents the key of the repo
- created_at: the date of creation of the repo`);
    const _options = program.parse(process.argv).opts();
    const outDir = _options.outdir || process.cwd();
    const fromDate = _options.fromDate ? new Date(_options.fromDate) : new Date(0);
    const toDate = _options.toDate ? new Date(_options.toDate) : new Date(Date.now());
    const languages = _options.languages || [];
    const creationDateCsvFilePath = _options.creationDateCsvFilePath || '';
    return {
        folderPath: _options.folderPath, outDir, fromDate, toDate, languages, creationDateCsvFilePath,
        excludeRepoPaths: _options.excludeRepoPaths
    };
}
//# sourceMappingURL=cloc-diff-between-dates.js.map