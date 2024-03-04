"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeClocDiffBetweenDatesForRepos$ = exports.writeClocDiffBetweenDates$ = exports.clocDiffBetweenDatesForRepos$ = exports.clocDiffBetweenDates$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const cloc_diff_byfile_1 = require("../cloc-functions/cloc-diff-byfile");
const commit_1 = require("../git-functions/commit");
const date_functions_1 = require("../tools/dates/date-functions");
const fs_utils_1 = require("../tools/fs-utils/fs-utils");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const repo_path_1 = require("../git-functions/repo-path");
const branches_1 = require("../git-functions/branches");
/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository
 * and returns an Observable that emits the cloc difference.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates
 * the cloc difference between these two commits for each file.
 * If no commit is found at the 'fromDate' or 'toDate', the function fetches the closest commit to the respective date.
 * The function also allows filtering by programming languages and excluding certain directories.
 *
 * @param {Date} fromDate - The start date for which to calculate the cloc difference.
 * @param {Date} toDate - The end date for which to calculate the cloc difference.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference. Defaults to 'master'.
 * @param {string} repoFolderPath - The path to the Git repository. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @param {Object} progress - An object to track the progress of the cloc calculation. Defaults to an object with 'totNumOfCommits', 'commitCounter', and 'errorCounter' all set to 0.
 * @param {string[]} notMatchDirectories - An array of directories to exclude from the cloc calculation. Defaults to an empty array (no exclusions).
 * @returns {Observable} An Observable that emits the cloc difference between the two dates for each file.
 */
function clocDiffBetweenDates$(fromDate, toDate, branchName = 'master', repoFolderPath = './', languages = [], notMatchDirectories = []) {
    const fromCommit = (0, commit_1.commitAtDateOrAfter$)(repoFolderPath, fromDate, branchName);
    const toCommit = (0, commit_1.commitAtDateOrBefore$)(repoFolderPath, toDate, branchName);
    return (0, rxjs_1.forkJoin)([fromCommit, toCommit]).pipe((0, rxjs_1.concatMap)(([[fromSha], [toSha]]) => {
        return (0, cloc_diff_byfile_1.clocDiffRelByfileWithCommitData$)(toSha, fromSha, repoFolderPath, languages, notMatchDirectories);
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${repoFolderPath}"`);
        console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
        return rxjs_1.EMPTY;
    }));
}
exports.clocDiffBetweenDates$ = clocDiffBetweenDates$;
function clocDiffBetweenDatesForRepos$(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), excludeRepoPaths = [], languages = [], creationDateCsvFilePath = null) {
    const repoPaths = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    let _repoPath = '';
    return (0, commit_1.repoPathAndFromDates$)(repoPaths, fromDate, creationDateCsvFilePath || null).pipe((0, rxjs_1.concatMap)(({ repoPath, _fromDate }) => {
        _repoPath = repoPath;
        return (0, branches_1.defaultBranchName$)(repoPath).pipe((0, rxjs_1.map)((branchName) => ({ repoPath, _fromDate, branchName })), (0, rxjs_1.catchError)((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while calculating differences for repo "${_repoPath}"`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            return rxjs_1.EMPTY;
        }));
    }), (0, rxjs_1.concatMap)(({ repoPath, _fromDate, branchName }) => {
        return clocDiffBetweenDates$(_fromDate, toDate, branchName, repoPath, languages);
    }));
}
exports.clocDiffBetweenDatesForRepos$ = clocDiffBetweenDatesForRepos$;
/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository
 * and writes the results to a CSV file.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates
 * the cloc difference between these two commits for each file.
 * If no commit is found at the 'fromDate' or 'toDate', the function fetches the closest commit to the respective date.
 * The function also allows filtering by programming languages.
 *
 * @param {string} pathToRepo - The path to the Git repository.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference.
 * @param {Date} fromDate - The start date for which to calculate the cloc difference. Defaults to the Unix epoch (1970-01-01 00:00:00 UTC).
 * @param {Date} toDate - The end date for which to calculate the cloc difference. Defaults to the current date and time.
 * @param {string} outDir - The directory where to save the CSV file. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @returns {Observable} An Observable that completes when the CSV file has been written and emits the path to the CSV file.
 */
function writeClocDiffBetweenDates$(pathToRepo, branchName, fromDate = new Date(0), toDate = new Date(Date.now()), outDir = './', languages = []) {
    const pathToRepoName = path_1.default.basename(pathToRepo);
    const outFile = `${pathToRepoName}-cloc-diff-between-${(0, date_functions_1.toYYYYMMDD)(fromDate)}-${(0, date_functions_1.toYYYYMMDD)(toDate)}.csv`;
    const outFilePath = path_1.default.join(outDir, outFile);
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(outFilePath).pipe((0, rxjs_1.concatMap)(() => clocDiffBetweenDates$(fromDate, toDate, branchName, pathToRepo, languages)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFilePath), (0, rxjs_1.tap)({
        next: (outFilePath) => {
            console.log(`====>>>> cloc-diff-between-dates info saved on file ${outFilePath}`);
        },
    }));
}
exports.writeClocDiffBetweenDates$ = writeClocDiffBetweenDates$;
function writeClocDiffBetweenDatesForRepos$(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), outDir = './', excludeRepoPaths = [], languages = [], creationDateCsvFilePath = null) {
    const folderName = path_1.default.basename(folderPath);
    const outFile = `${folderName}-cloc-diff-commit-${(0, date_functions_1.toYYYYMMDD)(fromDate)}-${(0, date_functions_1.toYYYYMMDD)(toDate)}.csv`;
    const outFilePath = path_1.default.join(outDir, outFile);
    let noCommitsFound = true;
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(outFilePath).pipe((0, rxjs_1.concatMap)(() => clocDiffBetweenDatesForRepos$(folderPath, fromDate, toDate, excludeRepoPaths, languages, creationDateCsvFilePath)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        noCommitsFound = false;
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFilePath), (0, rxjs_1.tap)({
        next: (outFilePath) => {
            if (noCommitsFound) {
                console.log(`\n====>>>> no commits found in the given time range, for the given languages, in the given repos`);
                return;
            }
            console.log(`\n====>>>> cloc-diff-commit-for-repos info saved on file ${outFilePath}`);
        },
    }));
}
exports.writeClocDiffBetweenDatesForRepos$ = writeClocDiffBetweenDatesForRepos$;
//# sourceMappingURL=cloc-diff-between-dates.js.map