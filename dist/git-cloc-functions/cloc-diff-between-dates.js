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
const repo_1 = require("../git-functions/repo");
const date_functions_1 = require("../tools/dates/date-functions");
const fs_utils_1 = require("../tools/fs-utils/fs-utils");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const repo_path_1 = require("../git-functions/repo-path");
const branches_1 = require("../git-functions/branches");
const cloc_at_date_commit_1 = require("./cloc-at-date-commit");
const execute_command_1 = require("../tools/execute-command/execute-command");
const cloc_diff_byfile_model_1 = require("../cloc-functions/cloc-diff-byfile.model");
const derived_fields_1 = require("./derived-fields");
/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository
 * and returns an Observable that emits the cloc difference.
 * The function fetches the commit at or before the 'fromDate' and the commit at or before the 'toDate' and calculates
 * the cloc difference between these two commits for each file.
 *
 * @param {Date} fromDate - The start date for which to calculate the cloc difference.
 * @param {Date} toDate - The end date for which to calculate the cloc difference.
 * @param {string} branchName - The name of the branch for which to calculate the cloc difference. Defaults to 'master'.
 * @param {string} repoPath - The path to the Git repository. Defaults to the current directory.
 * @param {string[]} languages - An array of programming languages to filter by. Defaults to an empty array (no filtering).
 * @param {Object} progress - An object to track the progress of the cloc calculation. Defaults to an object with 'totNumOfCommits', 'commitCounter', and 'errorCounter' all set to 0.
 * @param {string[]} notMatchDirectories - An array of directories to exclude from the cloc calculation. Defaults to an empty array (no exclusions).
 * @returns {Observable} An Observable that emits the cloc difference between the two dates for each file.
 */
function clocDiffBetweenDates$(fromDate, toDate, branchName, repoPath = './', reposFolderPath = './', languages = [], notMatchDirectories = [], options) {
    // if fromDate is after toDate, swap the two dates
    if (fromDate > toDate) {
        const temp = fromDate;
        fromDate = toDate;
        toDate = temp;
        console.log(`====>>>> fromDate is after toDate, swapping the two dates`);
    }
    const fromCommit = (0, commit_1.commitAtDateOrBefore$)(repoPath, fromDate, branchName, options);
    const toCommit = (0, commit_1.commitAtDateOrBefore$)(repoPath, toDate, branchName, options);
    const fromToCommits$ = (0, rxjs_1.forkJoin)([fromCommit, toCommit]).pipe((0, rxjs_1.share)());
    return fromToCommits$.pipe((0, rxjs_1.concatMap)(([fromShaDate, toShaDate]) => {
        var _a;
        const [fromSha, _fromDate] = fromShaDate;
        const [toSha, _toDate] = toShaDate;
        // if fromSha and toSha are the same, then we have not found any commit at or before the fromDate
        // and therefore we respond with an Observable that emits an empty array
        if (fromSha === toSha) {
            const errMsg = `No commit found at or before the fromDate "${(0, date_functions_1.toYYYYMMDD)(fromDate)}" for repo "${repoPath}"`;
            const errObj = {
                command: `no command run because no commit found at or before the fromDate "${(0, date_functions_1.toYYYYMMDD)(fromDate)}" for repo "${repoPath}"`,
                message: errMsg
            };
            (_a = options === null || options === void 0 ? void 0 : options.cmdErroredLog) === null || _a === void 0 ? void 0 : _a.push(errObj);
            return rxjs_1.EMPTY;
        }
        // if both fromSha and toSha are not empty, then we have found the commits at the two dates
        // and therefore we can calculate the cloc diff between the two commits
        if (fromSha && toSha) {
            const _fromShaDate = [fromSha, new Date(_fromDate)];
            const _toShaDate = [toSha, new Date(_toDate)];
            return calcDiffBetweenTwoCommits$(repoPath, reposFolderPath, _fromShaDate, _toShaDate, languages, notMatchDirectories, options);
        }
        // if fromSha is empty, then we have not found a commit at or before the fromDate and therefore
        // we calculate only the cloc for the toDate commit with all the values set to 0 for the fromDate
        else if (!fromSha) {
            return calcDiffWithOneCommit$(repoPath, reposFolderPath, toDate, toSha, options);
        }
        // if we arrive here it is because both fromSha and toSha are empty, which means that we have not found any commit
        else {
            return rxjs_1.EMPTY;
        }
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!!>> Error: while calculating cloc diff between dates for repo "${repoPath}"`);
        console.error(`!!!!!!!!!!!!!!!>> error message: ${err.message}`);
        console.error(`!!!!!!!!!!!!!!!>> stack: ${err.stack}`);
        return rxjs_1.EMPTY;
    }));
}
exports.clocDiffBetweenDates$ = clocDiffBetweenDates$;
function calcDiffBetweenTwoCommits$(repoPath, reposFolderPath, fromShaDate, toShaDate, languages = [], notMatchDirectories = [], options) {
    const [fromSha] = fromShaDate;
    const [toSha] = toShaDate;
    return (0, cloc_at_date_commit_1.clocFileDictAtCommits$)(repoPath, [fromSha, toSha], options).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((clocDicts) => {
        return { fromShaDate, toShaDate, fromDateClocDict: clocDicts[0], toDateClocDict: clocDicts[1] };
    }), (0, rxjs_1.concatMap)(({ fromShaDate, toShaDate, fromDateClocDict, toDateClocDict }) => {
        const fromSha = fromShaDate[0];
        const toSha = toShaDate[0];
        return (0, cloc_diff_byfile_1.clocDiffRelByfileWithCommitData$)(toSha, fromSha, repoPath, languages, notMatchDirectories, options).pipe((0, rxjs_1.map)((clocDiff) => {
            return { clocDiff, fromDateClocDict, toDateClocDict, fromShaDate, toShaDate };
        }));
    }), 
    // now enrich the cloc diff with the cloc dictionary and the commit data
    (0, rxjs_1.map)(({ clocDiff, fromDateClocDict, toDateClocDict, fromShaDate, toShaDate }) => {
        const [fromSha, _fromDate] = fromShaDate;
        const [toSha, _toDate] = toShaDate;
        const module = path_1.default.dirname(clocDiff.file);
        // area is the first folder in the repo path after removing reposFolderPath
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        // normalize the file path so that it starts always with a './'. The reason is that the clocDict
        // is built with the cloc command which returns file names starting with './' while the file path
        // in the clocDiff is built using the git log --numstat command which returns file names without './'
        const filePath = clocDiff.file.startsWith('./') ? clocDiff.file : `./${clocDiff.file}`;
        let _fromDateClocInfo = fromDateClocDict[filePath];
        let _toDateClocInfo = toDateClocDict[filePath];
        const language = (_fromDateClocInfo === null || _fromDateClocInfo === void 0 ? void 0 : _fromDateClocInfo.language) || (_toDateClocInfo === null || _toDateClocInfo === void 0 ? void 0 : _toDateClocInfo.language);
        const fromDateClocInfo = {
            from_code: _fromDateClocInfo ? _fromDateClocInfo.code : 0,
            from_comment: _fromDateClocInfo ? _fromDateClocInfo.comment : 0,
            from_blank: _fromDateClocInfo ? _fromDateClocInfo.blank : 0,
        };
        const toDateClocInfo = {
            to_code: _toDateClocInfo ? _toDateClocInfo.code : 0,
            to_comment: _toDateClocInfo ? _toDateClocInfo.comment : 0,
            to_blank: _toDateClocInfo ? _toDateClocInfo.blank : 0,
        };
        const clocDiffCommitEnriched = Object.assign(Object.assign(Object.assign(Object.assign({ language }, clocDiff), fromDateClocInfo), toDateClocInfo), { from_sha: fromSha, from_sha_date: (0, date_functions_1.toYYYYMMDD)(_fromDate), to_sha: toSha, to_sha_date: (0, date_functions_1.toYYYYMMDD)(_toDate), repo: repoPath, module,
            area });
        // set the file path relative to the current working directory to make it easier to read and possibly to link
        clocDiffCommitEnriched.file = path_1.default.relative(process.cwd(), clocDiffCommitEnriched.file);
        // delete the commit_code fields because are not relevant for the cloc diff between 2 specific dates
        delete clocDiffCommitEnriched.commit_code_added;
        delete clocDiffCommitEnriched.commit_code_removed;
        delete clocDiffCommitEnriched.commit_code_modified;
        delete clocDiffCommitEnriched.commit_code_same;
        delete clocDiffCommitEnriched.sumOfDiffs;
        return clocDiffCommitEnriched;
    }));
}
function calcDiffWithOneCommit$(repoPath, reposFolderPath, toDate, sha, options) {
    return (0, cloc_at_date_commit_1.clocFileDictAtCommits$)(repoPath, [sha], options).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((clocDicts) => {
        return { sha, toDateClocDict: clocDicts[0] };
    }), 
    // map the clocDictionary into an array of ClocDiffCommitBetweenDatesEnriched objects
    (0, rxjs_1.map)(({ sha, toDateClocDict }) => {
        return Object.keys(toDateClocDict).map((file) => {
            const toDateClocInfo = toDateClocDict[file];
            const module = path_1.default.dirname(toDateClocInfo.file);
            // area is the first folder in the repo path after removing reposFolderPath
            const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
            const language = toDateClocInfo.language;
            const clocDiffByFile = (0, cloc_diff_byfile_model_1.newClocDiffByfile)(file);
            clocDiffByFile.blank_added = toDateClocInfo.blank;
            clocDiffByFile.comment_added = toDateClocInfo.comment;
            clocDiffByFile.code_added = toDateClocInfo.code;
            const clocDiffCommitEnriched = Object.assign(Object.assign({ language }, clocDiffByFile), { isCopy: false, from_code: 0, from_comment: 0, from_blank: 0, to_code: toDateClocInfo.code, to_comment: toDateClocInfo.comment, to_blank: toDateClocInfo.blank, from_sha: '', from_sha_date: '', to_sha: sha, to_sha_date: (0, date_functions_1.toYYYYMMDD)(toDate), repo: repoPath, module,
                area });
            // set the file path relative to the current working directory to make it easier to read and possibly to link
            clocDiffCommitEnriched.file = path_1.default.relative(process.cwd(), clocDiffCommitEnriched.file);
            return clocDiffCommitEnriched;
        });
    }), (0, rxjs_1.concatMap)((clocDiffCommitEnriched) => {
        return clocDiffCommitEnriched;
    }));
}
function clocDiffBetweenDatesForRepos$(reposFolderPath, fromDate = new Date(0), toDate = new Date(Date.now()), options) {
    const { excludeRepoPaths, creationDateCsvFilePath, notMatch } = options;
    const repoPaths = (0, repo_path_1.gitRepoPaths)(reposFolderPath, excludeRepoPaths);
    return (0, repo_1.repoPathAndFromDates$)(repoPaths, fromDate, creationDateCsvFilePath || null).pipe((0, rxjs_1.concatMap)(({ repoPath, _fromDate }) => {
        return (0, branches_1.defaultBranchName$)(repoPath, options).pipe((0, rxjs_1.map)((branchName) => ({ repoPath, _fromDate, branchName })), (0, rxjs_1.catchError)((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while calculating default banch name for repo "${repoPath}"`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            return rxjs_1.EMPTY;
        }));
    }), (0, rxjs_1.concatMap)(({ repoPath, _fromDate, branchName }) => {
        const { languages } = options;
        return clocDiffBetweenDates$(_fromDate, toDate, branchName, repoPath, reposFolderPath, languages, notMatch, options);
    }));
}
exports.clocDiffBetweenDatesForRepos$ = clocDiffBetweenDatesForRepos$;
/**
 * This function calculates the difference in lines of code (cloc) between two dates for each file in a Git repository
 * and writes the results to a CSV file.
 * The function fetches the commit at or after the 'fromDate' and the commit at or before the 'toDate' and calculates
 * the cloc difference between these two commits for each file.
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
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(outFilePath).pipe((0, rxjs_1.concatMap)(() => clocDiffBetweenDates$(fromDate, toDate, branchName, pathToRepo, '', languages)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFilePath), (0, rxjs_1.tap)({
        next: (outFilePath) => {
            console.log(`====>>>> cloc-diff-between-dates info saved on file ${outFilePath}`);
        },
    }));
}
exports.writeClocDiffBetweenDates$ = writeClocDiffBetweenDates$;
function writeClocDiffBetweenDatesForRepos$(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), outDir = './', options = {
    excludeRepoPaths: [],
    notMatch: [],
    filePrefix: 'cloc-diff-between-dates',
}) {
    var _a, _b;
    const folderName = path_1.default.basename(folderPath);
    // timestamp in format YYYYMMDD-hhmmss.mmm to append to the file name
    const timestamp = new Date().toISOString();
    const outFile = `${folderName}-cloc-diff-between-dates-${(0, date_functions_1.toYYYYMMDD)(fromDate)}-${(0, date_functions_1.toYYYYMMDD)(toDate)}.${timestamp}.csv`;
    const outFilePath = path_1.default.join(outDir, outFile);
    options.cmdErroredLog = (_a = options.cmdErroredLog) !== null && _a !== void 0 ? _a : [];
    options.cmdExecutedLog = (_b = options.cmdExecutedLog) !== null && _b !== void 0 ? _b : [];
    let noCommitsFound = true;
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(outFilePath).pipe((0, rxjs_1.concatMap)(() => clocDiffBetweenDatesForRepos$(folderPath, fromDate, toDate, options)), (0, rxjs_1.tap)((d) => {
        console.log(`\n====>>>> cloc-diff-between-dates-for-repos info saved on file ${d}`);
    }), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        noCommitsFound = false;
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.last)(), (0, rxjs_1.catchError)((err) => {
        if (err.name === 'EmptyError') {
            console.log(`\n====>>>> no diffs found in the given time range, for the given languages, in the given repos`);
            // we must return something (hence we can not return EMPTY) since we want the stream to continue with just one more element
            // so that we can execture the writeCmdLogs$ function and write the cmd logs to file
            return (0, rxjs_1.of)(null);
        }
        throw err;
    }), (0, rxjs_1.tap)({
        next: () => {
            if (noCommitsFound) {
                console.log(`\n====>>>> no commits found in the given time range, for the given languages, in the given repos`);
                return;
            }
            console.log(`\n====>>>> cloc-between-dates-for-repos info saved on file ${outFilePath}`);
        },
    }), (0, rxjs_1.concatMap)(() => (0, execute_command_1.writeCmdLogs$)(options, outDir)));
}
exports.writeClocDiffBetweenDatesForRepos$ = writeClocDiffBetweenDatesForRepos$;
//# sourceMappingURL=cloc-diff-between-dates.js.map