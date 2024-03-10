"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeClocFromToDateByFileForRepos$ = exports.clocFromToDateByFileForRepos$ = exports.clocFileDictAtDate$ = exports.clocAtDateByFileForRepos$ = exports.clocAtDateByFile$ = void 0;
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
/**
 * This function calculates the lines of code (cloc data) at a specified date for each file in a Git repository and returns an
 * Observable that emits the cloc data in form of a string.
 * The function fetches the commit at or closest to the specified date and calculates the cloc for each file at that commit.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} reposFolderPath - The path to the folder containing the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits the cloc for each file at the specified date.
 */
function clocAtDateByFile$(repoPath, reposFolderPath, date, options) {
    return (0, repo_1.checkoutRepoAtDate$)(repoPath, date, options).pipe((0, rxjs_1.concatMap)((repoPathOrError) => {
        if (repoPathOrError instanceof git_errors_1.CheckoutError) {
            console.warn('checkoutRepoAtDate$ error', repoPathOrError);
            return (0, rxjs_1.of)(repoPathOrError);
        }
        const params = {
            folderPath: repoPathOrError.repoPath,
            vcs: 'git',
            notMatch: options.notMatch,
            languages: options.languages,
        };
        return (0, cloc_1.clocByfile$)(params, 'clocByFileForRepos$ running on ' + repoPathOrError.repoPath, false).pipe(
        // remove the first line which contains the csv header form all the streams representing
        // the output of the cloc command execution on each repo
        (0, rxjs_1.skip)(1), 
        // remove the last line which contains the total
        (0, rxjs_1.filter)((line) => line.slice(0, 3) !== 'SUM'), (0, rxjs_1.map)((line) => {
            // area is the first folder in the repo path after removing reposFolderPath
            const area = repoPath.split(reposFolderPath)[1].split(path_1.default.sep)[1];
            const fields = line.split(',');
            const filePath = fields[1];
            const module = path_1.default.dirname(filePath);
            const repoPathParts = repoPathOrError.repoPath.split(path_1.default.sep);
            const numberOfRepoPathParts = repoPathParts.length;
            const repoName = repoPathParts[numberOfRepoPathParts - 1];
            const repoDirName = numberOfRepoPathParts > 1 ?
                repoPathParts[numberOfRepoPathParts - 2] : '-';
            // add the repopath and the date in YYYY-MM-DD format at the end of each line
            return `${line},${repoPathOrError.repoPath},${(0, date_functions_1.toYYYYMMDD)(date)},${module},${repoName},${repoDirName},${repoPathOrError.sha},${area}`;
        }));
    }));
}
exports.clocAtDateByFile$ = clocAtDateByFile$;
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date and returns
 * an Observable that emits the LOC data.
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
        return clocAtDateByFile$(repoPath, reposFolderPath, date, options);
    }), (0, rxjs_1.startWith)(`${cloc_1.clocByfileHeader},repo,date,module,repoName,repoDirName,sha,area`));
}
exports.clocAtDateByFileForRepos$ = clocAtDateByFileForRepos$;
/**
 * This function calculates the lines of code (cloc) at a specified date for each file in a Git repository and returns
 * an Observable that emits a dictionary with the cloc info or an error if the checkout fails.
 * The function also allows excluding certain directories and filtering by programming languages.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {string} reposFolderPath - The path to the folder containing the Git repository.
 * @param {Date} date - The date for which to calculate the cloc.
 * @param {ClocOptions} options - An object containing options for the cloc calculation. Includes 'notMatch', an array of directories to exclude, and 'languages', an array of programming languages to filter by.
 * @returns {Observable} An Observable that emits a dictionary with the cloc info for each file at the specified date or an error if the checkout fails.
 */
function clocFileDictAtDate$(repoPath, reposFolderPath, date, options) {
    // clocAtDateByFile$ returns either a stream of strings representing the cloc info or an error if the checkout fails.
    // In this function we want to either return a dictionary with the cloc info or an error if the checkout fails.
    // Therefore we create 2 different streams, one for the cloc info and one for the error.
    // These 2 streams are created from the same source stream using the share operator.
    // We then filter the source stream to get the cloc info and the error stream to get the error.
    // We then merge the 2 streams to get a single stream that emits either the cloc info or the error.
    const clocShared$ = clocAtDateByFile$(repoPath, reposFolderPath, date, options).pipe((0, rxjs_1.share)());
    const err$ = clocShared$.pipe((0, rxjs_1.filter)((line) => line instanceof git_errors_1.CheckoutError), 
    // the map operator is used just to tell the compiler that err$ can emit only a CheckouErro
    // and not a string. 
    (0, rxjs_1.map)(err => err));
    const clocAtDateDict$ = clocShared$.pipe(
    // check that line is of type string
    (0, rxjs_1.filter)((line) => typeof line === 'string'), (0, rxjs_1.toArray)(), 
    // the map operator is used just to avoid the type error that would be thrown by the compiler
    // since the compiler believes that the result of toArray is an array of strings or an array of CheckoutError
    // but we know that the result is an array of strings since we filtered out the CheckoutError
    (0, rxjs_1.map)(strings => strings), (0, cloc_1.toClocFileDict)(repoPath));
    return (0, rxjs_1.merge)(err$, clocAtDateDict$);
}
exports.clocFileDictAtDate$ = clocFileDictAtDate$;
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
}) {
    const start = new Date();
    const { outDir } = options;
    if (!outDir) {
        throw new Error('outDir is required');
    }
    const folderName = path_1.default.basename(reposFolderPath);
    const outFile = `cloc-${folderName}-${(0, date_functions_1.toYYYYMMDD)(from)}_${(0, date_functions_1.toYYYYMMDD)(to)}`;
    const csvOutFilePath = path_1.default.join(outDir, outFile) + '.csv';
    const errorOutFilePath = path_1.default.join(outDir, outFile) + '.error.log';
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    let atLeastOneCsv = false;
    let atLeastOneError = false;
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(csvOutFilePath).pipe((0, rxjs_1.concatMap)(() => (0, delete_file_ignore_if_missing_1.deleteFile$)(errorOutFilePath)), (0, rxjs_1.concatMap)(() => clocFromToDateByFileForRepos$(reposFolderPath, from, to, options)), (0, rxjs_1.concatMap)((line) => {
        if (line instanceof git_errors_1.CheckoutError) {
            atLeastOneError = true;
            const erroringRepo = `Error checking out ${line.repoPath}\n` + `${line.message}\n`;
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
//# sourceMappingURL=cloc-at-date.js.map