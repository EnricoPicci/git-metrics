"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesStreamFromEnrichedCommitsStream = exports.filesStream = void 0;
const operators_1 = require("rxjs/operators");
const commits_1 = require("./commits");
// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data
function filesStream(commitLogPath, clocLogPath) {
    const _enrichedCommitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    return filesStreamFromEnrichedCommitsStream(_enrichedCommitStream);
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
                // first time the file is encountered is considered the date it has been created
                fileCreationDateDictionary[file.path] = created;
            }
            if (created > commit.committerDate) {
                console.warn(`!!!! The commit ${commit.hashShort} with file ${file.path} is older than a previous commit containing the same file even if git log is read in reverse order.`);
            }
            fileCreationDateDictionary[file.path] = created;
            return Object.assign(Object.assign(Object.assign({}, file), basicCommit), { created });
        });
        return enrichedFiles;
    }), 
    // consider only the commits which have files
    (0, operators_1.filter)((enrichedFiles) => enrichedFiles.length > 0), 
    // use mergeMap to flatten the array of arrays of FileGitCommitEnriched objects into an array of FileGitCommitEnriched objects
    (0, operators_1.mergeMap)((enrichedFilesBuffers) => enrichedFilesBuffers));
}
exports.filesStreamFromEnrichedCommitsStream = filesStreamFromEnrichedCommitsStream;
//# sourceMappingURL=files.js.map