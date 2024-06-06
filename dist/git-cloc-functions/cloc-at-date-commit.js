"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeClocFromToDateByFileForRepos$ = exports.clocFromToDateByFileForRepos$ = exports.clocFileDictAtCommits$ = exports.clocFileDictAtDates$ = exports.clocFileDictAtCommit$ = exports.clocFileDictAtDate$ = exports.clocAtDateByFileForRepos$ = exports.clocAtDateByFileEnriched$ = exports.clocAtCommitByFile$ = exports.clocAtDateByFile$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const cloc_1 = require("../cloc-functions/cloc");
const repo_path_1 = require("../git-functions/repo-path");
const repo_1 = require("../git-functions/repo");
const git_errors_1 = require("../git-functions/git-errors");
const date_functions_1 = require("../tools/dates/date-functions");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const fs_utils_1 = require("../tools/fs-utils/fs-utils");
const execute_command_1 = require("../tools/execute-command/execute-command");
const derived_fields_1 = require("./derived-fields");
/**
 * This function calculates the lines of code (cloc data) at the specified date (or at the date before if no commit is found at that date)
 * for each file in a Git repository and returns an Observable that emits the cloc data in form of a string.
 * The function fetches the commit at or before the specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified date.
 */
function clocAtDateByFile$(repoPath, date, options) {
    return (0, repo_1.checkoutRepoAtDate$)(repoPath, date, options).pipe((0, rxjs_1.concatMap)((repoPathSha) => {
        const params = {
            folderPath: repoPathSha.repoPath,
            vcs: 'git',
            notMatch: options === null || options === void 0 ? void 0 : options.notMatch,
            languages: options === null || options === void 0 ? void 0 : options.languages,
        };
        return (0, cloc_1.clocByfile$)(params, 'checkoutRepoAtDate$ running on ' + repoPathSha.repoPath, false, options).pipe((0, rxjs_1.map)((line) => {
            return {
                line,
                sha: repoPathSha.sha,
                commitDate: repoPathSha.commitDate,
            };
        }));
    }));
}
exports.clocAtDateByFile$ = clocAtDateByFile$;
/**
 * This function calculates the lines of code (cloc) at a specified commit for each file in a Git repository and
 * returns an Observable that emits the cloc info in the form of string.
 * The function checks out the repository at the specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} sha - The SHA of the commit for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified commit.
 */
function clocAtCommitByFile$(repoPath, sha, options) {
    return (0, repo_1.checkoutRepoAtCommit$)(repoPath, sha, options).pipe((0, rxjs_1.concatMap)(() => {
        const params = {
            folderPath: repoPath,
            vcs: 'git',
            notMatch: options === null || options === void 0 ? void 0 : options.notMatch,
            languages: options === null || options === void 0 ? void 0 : options.languages,
        };
        return (0, cloc_1.clocByfile$)(params, 'clocByFileForRepos$ running on ' + repoPath, false);
    }));
}
exports.clocAtCommitByFile$ = clocAtCommitByFile$;
/**
 * This function calculates the lines of code (cloc) at a specified date (or at the date before if no commit is found at that date)
 * for each file in a Git repository and returns an Observable that emits the cloc info along with additional information.
 * The function fetches the commit at or before the specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 * In addition to the cloc, the function also emits the path to the repository, the date in YYYY-MM-DD format, the directory of the file, the name of the repository, the directory of the repository, the SHA of the commit, and the first directory in the repository path after removing the path to the folder containing the repository.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} reposFolderPath - The path to the folder containing the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified date along with additional information.
 */
function clocAtDateByFileEnriched$(repoPath, reposFolderPath, date, options) {
    return clocAtDateByFile$(repoPath, date, options).pipe(
    // remove the first line which contains the csv header form all the streams representing
    // the output of the cloc command execution on each repo
    (0, rxjs_1.skip)(1), 
    // remove the last line which contains the total
    (0, rxjs_1.filter)((lineSha) => lineSha.line.slice(0, 3) !== 'SUM'), (0, rxjs_1.map)((lineSha) => {
        const { line, sha, commitDate } = lineSha;
        // area is the first folder in the repo path after removing reposFolderPath
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        const fields = line.split(',');
        const filePath = fields[1];
        const module = path_1.default.dirname(filePath);
        const repoPathParts = repoPath.split(path_1.default.sep);
        const numberOfRepoPathParts = repoPathParts.length;
        const repoName = repoPathParts[numberOfRepoPathParts - 1];
        const repoDirName = numberOfRepoPathParts > 1 ?
            repoPathParts[numberOfRepoPathParts - 2] : '-';
        // add the repopath and the date in YYYY-MM-DD format at the end of each line
        return `${line},${repoPath},${(0, date_functions_1.toYYYYMMDD)(date)},${module},${repoName},${repoDirName},${sha},${commitDate},${area}`;
    }));
}
exports.clocAtDateByFileEnriched$ = clocAtDateByFileEnriched$;
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date (or at the date before if no commit is
 * found at that date) and returns an Observable that emits the LOC data.
 * To bring the repositories to the state they were at the specified date, the function uses the git checkout command.
 * If an error is encountered while calculating the LOC for a certain repo, it will emit an error and move to the next repo.
 * @param reposFolderPath The path to the folder containing the repositories.
 * @param date The date to calculate the LOC at.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories or an error.
 */
function clocAtDateByFileForRepos$(reposFolderPath, date, options) {
    const repos = (0, repo_path_1.gitRepoPaths)(reposFolderPath, options.excludeRepoPaths);
    return (0, rxjs_1.from)(repos).pipe((0, rxjs_1.concatMap)((repoPath, i) => {
        console.log(`clocAtDateByFileForRepos$ processing repo ${i + 1} of ${repos.length}`);
        return clocAtDateByFileEnriched$(repoPath, reposFolderPath, date, options).pipe((0, rxjs_1.catchError)((err) => {
            if (err instanceof git_errors_1.GitError) {
                return (0, rxjs_1.of)(err);
            }
            throw err;
        }));
    }), (0, rxjs_1.startWith)(`${cloc_1.clocByfileHeader},repo,date,module,repoName,repoDirName,sha,commitDate,area`));
}
exports.clocAtDateByFileForRepos$ = clocAtDateByFileForRepos$;
/**
 * This function calculates the lines of code (cloc) at a specified date (or at the date before if no commit is found at that date)
 * for each file in a Git repository and returns an Observable that emits a dictionary with the cloc info
 * and the sha at which the repo has been checked out.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at the specified date or an error if the checkout fails.
 */
function clocFileDictAtDate$(repoPath, date, options) {
    let _sha = '';
    let _commitDate = '';
    return clocAtDateByFile$(repoPath, date, options).pipe((0, rxjs_1.map)((lineSha) => {
        const { line, sha, commitDate } = lineSha;
        _sha = sha;
        _commitDate = commitDate;
        return line;
    }), (0, rxjs_1.toArray)(), (0, cloc_1.toClocFileDict)(repoPath), (0, rxjs_1.map)((dict) => {
        return {
            dict,
            sha: _sha,
            commitDate: _commitDate,
        };
    }));
}
exports.clocFileDictAtDate$ = clocFileDictAtDate$;
/**
 * This function calculates the lines of code (cloc) at a specified commit for each file in a Git repository and
 * returns an Observable that emits a dictionary with the cloc info.
 * The function checks out the repository at the specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} sha - The SHA of the commit for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at the specified commit.
 */
function clocFileDictAtCommit$(repoPath, sha, options) {
    return clocAtCommitByFile$(repoPath, sha, options).pipe((0, rxjs_1.toArray)(), (0, cloc_1.toClocFileDict)(repoPath), (0, rxjs_1.map)((dict) => {
        return dict;
    }));
}
exports.clocFileDictAtCommit$ = clocFileDictAtCommit$;
/**
 * This function calculates the lines of code (cloc) at specified dates for each file in a Git repository and returns
 * an Observable that emits a dictionary with the cloc info for each date.
 * The function fetches the commit at or closest to each specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date[]} dates - An array of dates for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at each specified date.
 */
function clocFileDictAtDates$(repoPath, dates, options) {
    const clocDictAtDates$ = dates.map(date => clocFileDictAtDate$(repoPath, date, options));
    return (0, rxjs_1.concat)(...clocDictAtDates$);
}
exports.clocFileDictAtDates$ = clocFileDictAtDates$;
/**
 * This function calculates the lines of code (cloc) at specified commits for each file in a Git repository and
 * returns an Observable that emits a dictionary with the cloc info for each commit.
 * The function checks out the repository at each specified commit and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string[]} shas - An array of SHAs of the commits for which to calculate the cloc.
 * @param {ClocOptions} options - An optional object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at each specified commit.
 */
function clocFileDictAtCommits$(repoPath, shas, options) {
    const clocDictAtCommit$ = shas.map(sha => clocFileDictAtCommit$(repoPath, sha, options));
    return (0, rxjs_1.concat)(...clocDictAtCommit$);
}
exports.clocFileDictAtCommits$ = clocFileDictAtCommits$;
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates and returns
 * an Observable that emits the LOC data.
 * If an error is encountered while calculating the LOC, the Observable will emit the error and complete.
 * @param folderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param outDir The directory to write the output files to. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories at the two dates.
 */
function clocFromToDateByFileForRepos$(folderPath, from, to, options) {
    return (0, rxjs_1.concat)(clocAtDateByFileForRepos$(folderPath, from, options), clocAtDateByFileForRepos$(folderPath, to, options).pipe(
    // skip the first line which contains the csv header
    (0, rxjs_1.skip)(1)));
}
exports.clocFromToDateByFileForRepos$ = clocFromToDateByFileForRepos$;
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates,
 * writes the LOC data to a CSV file, and returns an Observable that emits when the operation is complete.
 * If errors are encountered they will be written to a separate file.
 * @param reposFolderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param options An object containing options for the operation. Defaults to an object with the outDir property set to './',
 * and the excludeRepoPaths and notMatch properties set to empty arrays.
 * @returns An Observable that emits when the operation is complete.
 * @throws An error if the outDir property in the options parameter is not provided.
 */
function writeClocFromToDateByFileForRepos$(reposFolderPath, from, to, options = {
    outDir: './',
    excludeRepoPaths: [],
    notMatch: [],
    filePrefix: 'cloc-from-to-date',
}) {
    var _a, _b, _c;
    const start = new Date();
    const { outDir } = options;
    if (!outDir) {
        throw new Error('outDir is required');
    }
    const folderName = path_1.default.basename(reposFolderPath);
    const outFile = `cloc-${folderName}-${(0, date_functions_1.toYYYYMMDD)(from)}_${(0, date_functions_1.toYYYYMMDD)(to)}`;
    const csvOutFilePath = path_1.default.join(outDir, outFile) + '.csv';
    const errorOutFilePath = path_1.default.join(outDir, outFile) + '.error.log';
    options.cmdErroredLog = (_a = options.cmdErroredLog) !== null && _a !== void 0 ? _a : [];
    options.cmdExecutedLog = (_b = options.cmdExecutedLog) !== null && _b !== void 0 ? _b : [];
    const _stdErrorHandler = (stderr) => {
        console.log(`!!!!!!!! Message on stadard error:\n${stderr}`);
        let retVal = null;
        if (stderr.includes('fatal: ambiguous argument')) {
            retVal = new Error(stderr);
            retVal.name = 'CheckoutError';
            retVal.message = stderr;
        }
        return retVal;
    };
    options.stdErrorHandler = (_c = options.stdErrorHandler) !== null && _c !== void 0 ? _c : _stdErrorHandler;
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    let atLeastOneCsv = false;
    let atLeastOneError = false;
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(csvOutFilePath).pipe((0, rxjs_1.concatMap)(() => (0, delete_file_ignore_if_missing_1.deleteFile$)(errorOutFilePath)), (0, rxjs_1.concatMap)(() => clocFromToDateByFileForRepos$(reposFolderPath, from, to, options)), (0, rxjs_1.concatMap)((line) => {
        if (line instanceof git_errors_1.GitError) {
            atLeastOneError = true;
            const erroringRepo = `Error in repo ${line.repoPath}\n` + `${line.message}\n`;
            return (0, observable_fs_1.appendFileObs)(errorOutFilePath, erroringRepo);
        }
        atLeastOneCsv = true;
        return (0, observable_fs_1.appendFileObs)(csvOutFilePath, `${line}\n`);
    }), (0, rxjs_1.last)(), (0, rxjs_1.concatMap)(() => (0, execute_command_1.writeCmdLogs$)(options, outDir)), (0, rxjs_1.tap)({
        complete: () => {
            if (atLeastOneCsv) {
                console.log(`====>>>> cloc info at dates ${(0, date_functions_1.toYYYYMMDD)(from)} and ${(0, date_functions_1.toYYYYMMDD)(to)} saved on file ${csvOutFilePath}`);
            }
            if (atLeastOneError) {
                console.log(`====>>>> errors saved on file ${errorOutFilePath}`);
            }
            else {
                console.log(`====>>>> No errors encountered`);
            }
            const end = new Date();
            console.log(`====>>>> writeClocFromToDateByFileForRepos$ completed in ${(end.getTime() - start.getTime()) / 1000} seconds`);
        },
    }));
}
exports.writeClocFromToDateByFileForRepos$ = writeClocFromToDateByFileForRepos$;
//# sourceMappingURL=cloc-at-date-commit.js.map