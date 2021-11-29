"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesStreamFromEnrichedCommitsStream = exports.filesStream = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const commits_1 = require("./commits");
// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data
function filesStream(commitLogPath, clocLogPath) {
    return filesStreamFromEnrichedCommitsStream((0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath));
}
exports.filesStream = filesStream;
function filesStreamFromEnrichedCommitsStream(enrichedCommitsStream) {
    const fileCreationDateDictionary = {};
    return enrichedCommitsStream.pipe(
    // create an array of files where each file has also the details of the commit
    (0, operators_1.map)((commit) => {
        const files = [...commit.files];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const basicCommit = Object.assign({}, commit);
        delete basicCommit.files;
        const enrichedFiles = files.map((file) => {
            // set the file creation date as the date of the first commit which shows this file
            let created = fileCreationDateDictionary[file.path];
            if (!created) {
                created = commit.committerDate;
            }
            created = created > commit.committerDate ? commit.committerDate : created;
            fileCreationDateDictionary[file.path] = created;
            return Object.assign(Object.assign({}, file), basicCommit);
        });
        return enrichedFiles;
    }), 
    // consider only the commits which have files
    (0, operators_1.filter)((enrichedFiles) => enrichedFiles.length > 0), 
    // toArray makes sure that upstream is completed before we proceed, which is important since we need to have the fileCreationDateDictionary
    // completely filled if we want to set the created date right on each file
    (0, operators_1.toArray)(), 
    // use mergeMap to flatten the array of arrays of FileGitCommitEnriched objects into an array of FileGitCommitEnriched objects
    (0, operators_1.mergeMap)((enrichedFilesBuffers) => enrichedFilesBuffers), 
    // use concatMap since I need to be sure that the upstream completes so that I have the fileCreationDateDictionary filled correctly
    (0, operators_1.concatMap)((enrichedFiles) => 
    // transform the array of file documents into a stream
    (0, rxjs_1.from)(enrichedFiles).pipe((0, operators_1.map)((file) => {
        const created = fileCreationDateDictionary[file.path];
        return Object.assign(Object.assign({}, file), { created });
    }))));
}
exports.filesStreamFromEnrichedCommitsStream = filesStreamFromEnrichedCommitsStream;
//# sourceMappingURL=files.js.map