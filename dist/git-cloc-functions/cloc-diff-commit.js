"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocDiffWithCommit$ = void 0;
const rxjs_1 = require("rxjs");
const cloc_dictionary_1 = require("../cloc-functions/cloc-dictionary");
const commit_functions_1 = require("../git-functions/commit.functions");
const cloc_diff_byfile_1 = require("../cloc-functions/cloc-diff-byfile");
// clocDiffWithCommit is a function that takes a path to a git repo, a start and an end date and calculates
// the diffences between the commits in the given time range (the comparison is performed with
// the parent commit of each commit), enriched with the data retrieved using cloc (like lines
// of code, comments and blanks) as well as the data of the commit itself (like author, date, message, etc.).
// The function returns an Observable of ClocDiffCommitEnriched objects, each containing the differences for all
// the files that have changed in the single commit when compared to its parent commit.
function clocDiffWithCommit$(pathToRepo, fromDate = new Date(0), toDate = new Date(Date.now()), languages = []) {
    // first calculate the cloc dictionary and pass it down the pipe
    return (0, cloc_dictionary_1.clocFileDict$)(pathToRepo).pipe(
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
        return clocDiffCommitEnriched;
    }));
}
exports.clocDiffWithCommit$ = clocDiffWithCommit$;
//# sourceMappingURL=cloc-diff-commit.js.map