"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeClocDiffWithCommit$ = exports.clocDiffWithCommit$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const cloc_dictionary_1 = require("../cloc-functions/cloc-dictionary");
const cloc_diff_byfile_1 = require("../cloc-functions/cloc-diff-byfile");
const commit_functions_1 = require("../git-functions/commit.functions");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Calculates the differences between the commits in a given time range (the comparison is performed with the parent commit of each commit),
 * enriched with the data retrieved using cloc (like lines of code, comments and blanks) as well as the data of the commit itself
 * (like author, date, message, etc.).
 * The function returns an Observable of ClocDiffCommitEnriched objects, each containing the differences for all the files
 * that have changed in the single commit when compared to its parent commit.
 * @param pathToRepo The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable of ClocDiffCommitEnriched objects.
 */
function clocDiffWithCommit$(pathToRepo, fromDate = new Date(0), toDate = new Date(Date.now()), languages = []) {
    // first calculate the cloc dictionary and pass it down the pipe
    return (0, cloc_dictionary_1.clocFileDict$)(pathToRepo).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            console.log(`!!!!!!!! folder ${pathToRepo} not found`);
            process.exit(1);
        }
        throw err;
    }), 
    // then read the commits in the given time range and pass them down the pipe together with the cloc dictionary
    (0, rxjs_1.concatMap)((clocFileDict) => {
        return (0, commit_functions_1.readCommitCompact$)(pathToRepo, fromDate, toDate).pipe((0, rxjs_1.map)((commit) => {
            return { commit, clocFileDict };
        }));
    }), 
    // then calculate the cloc diff for each commit (against its parent) and pass it down the pipe 
    // together with the cloc dictionary and the commit
    (0, rxjs_1.concatMap)(({ commit, clocFileDict }) => {
        return (0, cloc_diff_byfile_1.clocDiffWithParentByfile$)(commit.sha, pathToRepo, languages).pipe((0, rxjs_1.map)((clocDiffByfile) => {
            return { clocDiffByfile, clocFileDict, commit };
        }));
    }), 
    // now enrich the cloc diff with the cloc dictionary and the commit data
    (0, rxjs_1.map)(({ clocDiffByfile, clocFileDict, commit }) => {
        let clocInfo = clocFileDict[clocDiffByfile.file];
        if (!clocInfo) {
            clocInfo = {
                code: 0,
                comment: 0,
                blank: 0,
                language: '',
                file: clocDiffByfile.file
            };
        }
        const clocDiffCommitEnriched = Object.assign(Object.assign(Object.assign({}, clocDiffByfile), clocInfo), commit);
        clocDiffCommitEnriched.possibleCutPaste = isPossibleCutPaste(clocDiffCommitEnriched);
        return clocDiffCommitEnriched;
    }));
}
exports.clocDiffWithCommit$ = clocDiffWithCommit$;
/**
 * Writes the cloc diff information, enriched with lines of code data and commit data, for a Git repository to a CSV file.
 * The file name is derived from the repository name, the start date, and the end date.
 * Returns an Observable that notifies the name of the file where the cloc diff info is saved once the cloc command execution is finished.
 * @param pathToRepo The path to the Git repository folder.
 * @param outDir The path to the folder where the output file should be saved. Defaults to the current directory.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable that emits the name of the file where the cloc diff info is saved.
 */
function writeClocDiffWithCommit$(pathToRepo, outDir = './', fromDate = new Date(0), toDate = new Date(Date.now()), languages = []) {
    const pathToRepoName = path_1.default.basename(pathToRepo);
    const outFile = `${pathToRepoName}-cloc-diff-commit-${fromDate.toISOString().split('T')[0]}-${toDate.toISOString().split('T')[0]}.csv`;
    const outFilePath = path_1.default.join(outDir, outFile);
    return (0, observable_fs_1.deleteFileObs)(outFilePath).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // complete so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }), (0, rxjs_1.concatMap)(() => clocDiffWithCommit$(pathToRepo, fromDate, toDate, languages)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFilePath), (0, rxjs_1.tap)({
        next: (outFilePath) => {
            console.log(`====>>>> cloc-diff-commit info saved on file ${outFilePath}`);
        },
    }));
}
exports.writeClocDiffWithCommit$ = writeClocDiffWithCommit$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
// the change is a possible cut and paste if the number of lines of code added is equal to the number of lines removed
// and the number of lines added is greater than 0 (which means that there are lines of code added and removed) 
// and the number of lines modified is 0
function isPossibleCutPaste(clocDiffCommitEnriched) {
    return clocDiffCommitEnriched.code_added === clocDiffCommitEnriched.code_removed &&
        clocDiffCommitEnriched.code_added > 0 &&
        clocDiffCommitEnriched.code_modified === 0;
}
//# sourceMappingURL=cloc-diff-commit.js.map