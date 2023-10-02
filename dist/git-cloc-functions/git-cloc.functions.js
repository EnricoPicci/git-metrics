"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitWithFileNumstatsEnrichedWithCloc$ = void 0;
const rxjs_1 = require("rxjs");
function commitWithFileNumstatsEnrichedWithCloc$(commits$, clocDictionary$) {
    clocDictionary$.pipe((0, rxjs_1.concatMap)((clocDict) => commits$.pipe((0, rxjs_1.map)((commit) => newCommitWithFileNumstatsEnrichedWithCloc(commit, clocDict)))));
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
    const { code, comment, blank } = clocDictionary[file.path];
    return Object.assign(Object.assign({}, file), { code, comment, blank });
}
//# sourceMappingURL=git-cloc.functions.js.map