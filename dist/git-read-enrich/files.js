"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesStreamFromEnrichedCommitsStream = exports.filesStream = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const commits_1 = require("./commits");
// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data
function filesStream(commitLogPath, clocLogPath) {
    return (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe(
    // create an array of files where each file has also the details of the commit
    (0, operators_1.map)((commit) => {
        const files = [...commit.files];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const basicCommit = Object.assign({}, commit);
        delete basicCommit.files;
        const enrichedFiles = files.map((file) => (Object.assign(Object.assign({}, file), basicCommit)));
        return enrichedFiles;
    }), 
    // consider only the commits which have files
    (0, operators_1.filter)((enrichedFiles) => enrichedFiles.length > 0), 
    // transform the array of file documents into a stream
    (0, operators_1.mergeMap)((enrichedFiles) => (0, rxjs_1.from)(enrichedFiles)));
}
exports.filesStream = filesStream;
function filesStreamFromEnrichedCommitsStream(enrichedCommitsStream) {
    return enrichedCommitsStream.pipe(
    // create an array of files where each file has also the details of the commit
    (0, operators_1.map)((commit) => {
        const files = [...commit.files];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const basicCommit = Object.assign({}, commit);
        delete basicCommit.files;
        const enrichedFiles = files.map((file) => (Object.assign(Object.assign({}, file), basicCommit)));
        return enrichedFiles;
    }), 
    // consider only the commits which have files
    (0, operators_1.filter)((enrichedFiles) => enrichedFiles.length > 0), 
    // transform the array of file documents into a stream
    (0, operators_1.mergeMap)((enrichedFiles) => (0, rxjs_1.from)(enrichedFiles)));
}
exports.filesStreamFromEnrichedCommitsStream = filesStreamFromEnrichedCommitsStream;
//# sourceMappingURL=files.js.map