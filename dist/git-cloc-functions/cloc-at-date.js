"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeClocFromToDateByFileForRepos$ = exports.clocFromToDateByFileForRepos$ = exports.clocAtDateByFileForRepos$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const cloc_1 = require("../cloc-functions/cloc");
const repo_path_1 = require("../git-functions/repo-path");
const repo_1 = require("../git-functions/repo");
const repo_errors_1 = require("../git-functions/repo.errors");
const date_functions_1 = require("../tools/dates/date-functions");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const fs_utils_1 = require("../tools/fs-utils/fs-utils");
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at a specific date and returns
 * an Observable that emits the LOC data.
 * To bring the repositories to the state they were at the specified date, the function uses the git checkout command.
 * If an error is encountered while calculating the LOC for a certain repo, it will emit an error and move to the next repo.
 * @param folderPath The path to the folder containing the repositories.
 * @param date The date to calculate the LOC at.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation. Defaults to an empty array.
 * @returns An Observable that emits the LOC data for each file in the repositories or an error.
 */
function clocAtDateByFileForRepos$(folderPath, date, options) {
    const { outDir, excludeRepoPaths, notMatch } = options;
    const repos = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    return (0, rxjs_1.from)(repos).pipe((0, rxjs_1.concatMap)((repoPath) => {
        // piping the cloc calculation into the Observable returned by checkoutRepoAtDate$ makes sure that the 
        // cloc calculation is done on the repo just after the checkout is done
        // Otherwise, if we move the cloc calculation up one level, i.e. in the same pipe were the checkout is done,
        // we would obtain a solution where the checkouts are performed massively while we wait for the cloc calculation
        // to complete on the first repo.
        // The net result would be the same, but we would see the checkouts completing fast and the cloc completing slowly
        // which is correct since the cloc calculation is the slowest part of the process, but could be more diffucult to 
        // to follow looking simply at the logs.
        return (0, repo_1.checkoutRepoAtDate$)(repoPath, date, options).pipe((0, rxjs_1.concatMap)((repoPathOrError) => {
            if (repoPathOrError instanceof repo_errors_1.CheckoutError) {
                console.warn('checkoutRepoAtDate$ error', repoPathOrError);
                return (0, rxjs_1.of)(repoPathOrError);
            }
            const params = {
                folderPath: repoPathOrError,
                vcs: 'git',
                outDir,
                notMatch,
            };
            return (0, cloc_1.clocByfile$)(params, 'clocByFileForRepos$ running on ' + repoPathOrError, false).pipe(
            // remove the first line which contains the csv header form all the streams representing
            // the output of the cloc command execution on each repo
            (0, rxjs_1.skip)(1), 
            // remove the last line which contains the total
            (0, rxjs_1.filter)((line) => line.slice(0, 3) !== 'SUM'), (0, rxjs_1.map)((line) => {
                const fields = line.split(',');
                const filePath = fields[1];
                const module = path_1.default.dirname(filePath);
                const repoPathParts = repoPathOrError.split(path_1.default.sep);
                const numberOfRepoPathParts = repoPathParts.length;
                const repoName = repoPathParts[numberOfRepoPathParts - 1];
                const repoDirName = numberOfRepoPathParts > 1 ?
                    repoPathParts[numberOfRepoPathParts - 2] : '-';
                // add the repopath and the date in YYYY-MM-DD format at the end of each line
                return `${line},${repoPathOrError},${(0, date_functions_1.toYYYYMMDD)(date)},${module}, ${repoName}, ${repoDirName}`;
            }));
        }));
    }), (0, rxjs_1.startWith)(`${cloc_1.clocByfileHeader},repo,date,module,repoName,repoDirName`));
}
exports.clocAtDateByFileForRepos$ = clocAtDateByFileForRepos$;
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
    return (0, rxjs_1.concat)(clocAtDateByFileForRepos$(folderPath, from, options), clocAtDateByFileForRepos$(folderPath, to, options));
}
exports.clocFromToDateByFileForRepos$ = clocFromToDateByFileForRepos$;
/**
 * Calculates the lines of code (LOC) for each file in a set of repositories at two specific dates,
 * writes the LOC data to a CSV file, and returns an Observable that emits when the operation is complete.
 * If errors are encountered they will be written to a separate file.
 * @param folderPath The path to the folder containing the repositories.
 * @param from The start date to calculate the LOC at.
 * @param to The end date to calculate the LOC at.
 * @param options An object containing options for the operation. Defaults to an object with the outDir property set to './',
 * and the excludeRepoPaths and notMatch properties set to empty arrays.
 * @returns An Observable that emits when the operation is complete.
 * @throws An error if the outDir property in the options parameter is not provided.
 */
function writeClocFromToDateByFileForRepos$(folderPath, from, to, options = {
    outDir: './',
    excludeRepoPaths: [],
    notMatch: [],
    branch: 'master'
}) {
    const start = new Date();
    const { outDir } = options;
    if (!outDir) {
        throw new Error('outDir is required');
    }
    const folderName = path_1.default.basename(folderPath);
    const outFile = `cloc-${folderName}-${(0, date_functions_1.toYYYYMMDD)(from)}_${(0, date_functions_1.toYYYYMMDD)(to)}`;
    const csvOutFilePath = path_1.default.join(outDir, outFile) + '.csv';
    const errorOutFilePath = path_1.default.join(outDir, outFile) + '.error.log';
    (0, fs_utils_1.createDirIfNotExisting)(outDir);
    let atLeastOneCsv = false;
    let atLeastOneError = false;
    return (0, delete_file_ignore_if_missing_1.deleteFile$)(csvOutFilePath).pipe((0, rxjs_1.concatMap)(() => (0, delete_file_ignore_if_missing_1.deleteFile$)(errorOutFilePath)), (0, rxjs_1.concatMap)(() => clocFromToDateByFileForRepos$(folderPath, from, to, options)), (0, rxjs_1.concatMap)((line) => {
        if (line instanceof repo_errors_1.CheckoutError) {
            atLeastOneError = true;
            const erroringRepo = `Error checking out ${line.repoPath}\n` + `${line.error.message}\n`;
            return (0, observable_fs_1.appendFileObs)(errorOutFilePath, erroringRepo);
        }
        atLeastOneCsv = true;
        return (0, observable_fs_1.appendFileObs)(csvOutFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.tap)({
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