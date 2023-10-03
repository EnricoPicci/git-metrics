"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitWithFileNumstatsEnrichedWithCloc$ = void 0;
const rxjs_1 = require("rxjs");
/**
 * Takes an Observable of `CommitWithFileNumstats` objects and an Observable emitting one `ClocDictionary` object,
 * and returns an Observable that emits a stream of `CommitWithFileNumstatsEnrichedWithCloc` objects representing
 * the commits enriched with the number of lines of code, comments, and blanks for each file in each commit.
 * If a file present in the commit is not present in the cloc dictionary, it means that the file is either a file
 * not considered by cloc (e.g. a binary file) or a file that has been deleted after the commit was created. In this case
 * the file is enriched with 0 lines of code, comments and blanks.
 * @param commits$ An Observable of `CommitWithFileNumstats` objects representing the commits with the number of lines added and removed for each file in each commit.
 * @param clocDictionary$ An Observable of `ClocDictionary` objects representing the cloc info for each file in the repository.
 * @returns An Observable that emits a stream of `CommitWithFileNumstatsEnrichedWithCloc` objects representing the commits enriched with the number of lines of code, comments, and blanks for each file in each commit.
 */
function commitWithFileNumstatsEnrichedWithCloc$(commits$, clocDictionary$) {
    return clocDictionary$.pipe((0, rxjs_1.concatMap)((clocDict) => {
        return commits$.pipe((0, rxjs_1.map)((commit) => newCommitWithFileNumstatsEnrichedWithCloc(commit, clocDict)));
    }));
}
exports.commitWithFileNumstatsEnrichedWithCloc$ = commitWithFileNumstatsEnrichedWithCloc$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
function newCommitWithFileNumstatsEnrichedWithCloc(commit, clocDictionary) {
    const files = commit.files.map((file) => newGitFileNumstatEnrichedWithCloc(file, clocDictionary));
    return Object.assign(Object.assign({}, commit), { files });
}
function newGitFileNumstatEnrichedWithCloc(file, clocDictionary) {
    // if the file is not in the cloc dictionary, it may mean different things, 
    // e.g. that it is a binary file, so we return a file with 0 lines of code, comments and blanks
    // or that it is a file that is present in an old commit but has been subsequently deleted, 
    // so we return a file with 0 lines of code, comments and blanks
    if (!clocDictionary[file.path]) {
        return Object.assign(Object.assign({}, file), { code: 0, comment: 0, blank: 0 });
    }
    const { code, comment, blank } = clocDictionary[file.path];
    return Object.assign(Object.assign({}, file), { code, comment, blank });
}
//# sourceMappingURL=commit-cloc.functions.js.map