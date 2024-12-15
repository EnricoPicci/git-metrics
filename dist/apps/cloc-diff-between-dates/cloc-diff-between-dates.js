"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchDiffBetweenDatesMultiRepos = void 0;
const commander_1 = require("commander");
const cloc_diff_between_dates_1 = require("../../git-cloc-functions/cloc-diff-between-dates");
const cloc_diff_between_dates_params_1 = require("./cloc-diff-between-dates-params");
function launchDiffBetweenDatesMultiRepos() {
    console.log('====>>>> Launching Diff Between Dates For Repos');
    const params = readParams();
    const { folderPath, outDir, fromDate, toDate, languages, creationDateCsvFilePath, excludeRepoPaths } = params;
    const options = { excludeRepoPaths, languages, creationDateCsvFilePath, filePrefix: 'cloc-diff-between-dates' };
    console.log(`Paramters: folderPath: ${folderPath}, outDir: ${outDir}, fromDate: ${fromDate}, toDate: ${toDate}, languages: ${languages}, creationDateCsvFilePath: ${creationDateCsvFilePath}, excludeRepoPaths: ${excludeRepoPaths}`);
    (0, cloc_diff_between_dates_1.writeClocDiffBetweenDatesForRepos$)(folderPath, new Date(fromDate), new Date(toDate), outDir, options).subscribe();
}
exports.launchDiffBetweenDatesMultiRepos = launchDiffBetweenDatesMultiRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to calculate the differences in a set of repos between 2 dates')
        .option('--params-json <string>', `path to the json file containing the parameters for the command (e.g. ./params.json)`)
        .option('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
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
    // if the params-json option is provided, read the parameters from the json file
    let params;
    if (_options.paramsJson) {
        params = cloc_diff_between_dates_params_1.ClocDiffBetweenDatesParams.fromJSONFile(_options.paramsJson);
    }
    const folderPath = _options.folderPath || (params === null || params === void 0 ? void 0 : params.folderPath);
    if (!folderPath) {
        throw new Error('The folderPath parameter is required');
    }
    const outDir = _options.outdir || (params === null || params === void 0 ? void 0 : params.outDir) || process.cwd();
    const fromDateString = _options.fromDate || (params === null || params === void 0 ? void 0 : params.fromDate);
    const fromDate = fromDateString ? new Date(fromDateString) : new Date(0);
    const toDateString = _options.toDate || (params === null || params === void 0 ? void 0 : params.toDate);
    const toDate = toDateString ? new Date(toDateString) : new Date(Date.now());
    const languages = _options.languages || (params === null || params === void 0 ? void 0 : params.languages) || [];
    const creationDateCsvFilePath = _options.creationDateCsvFilePath || (params === null || params === void 0 ? void 0 : params.creationDateCsvFilePath) || '';
    const excludeRepoPaths = _options.excludeRepoPaths || (params === null || params === void 0 ? void 0 : params.excludeRepoPaths) || [];
    return new cloc_diff_between_dates_params_1.ClocDiffBetweenDatesParams(folderPath, outDir, fromDate.toISOString(), toDate.toISOString(), languages, creationDateCsvFilePath, excludeRepoPaths);
}
//# sourceMappingURL=cloc-diff-between-dates.js.map