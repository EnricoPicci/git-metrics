"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileChurnDictionary = exports.fileChurn = void 0;
const operators_1 = require("rxjs/operators");
// receives a stream of FileGitCommitEnriched objects and returns a stream of FileChurn objects
function fileChurn(fileCommits, after) {
    return fileChurnDictionary(fileCommits, after).pipe((0, operators_1.map)((fileChurnDictionary) => {
        return Object.values(fileChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
    }));
}
exports.fileChurn = fileChurn;
// returns a dictionary whose key is the file path and the value is a FileChurn object with all properties filled
// exported for testing purposes only
function fileChurnDictionary(fileCommits, after) {
    return fileCommits.pipe((0, operators_1.reduce)((acc, fileCommit) => {
        var _a;
        if (fileCommit.committerDate < after) {
            return acc;
        }
        if (!acc[fileCommit.path]) {
            acc[fileCommit.path] = {
                path: fileCommit.path,
                cloc: (_a = fileCommit.cloc) !== null && _a !== void 0 ? _a : 0,
                commits: 0,
                linesAddDel: 0,
                linesAdded: 0,
                linesDeleted: 0,
                created: new Date(),
            };
        }
        const fileEntry = acc[fileCommit.path];
        fileEntry.commits++;
        fileEntry.linesAdded = fileEntry.linesAdded + fileCommit.linesAdded;
        fileEntry.linesDeleted = fileEntry.linesDeleted + fileCommit.linesDeleted;
        fileEntry.linesAddDel = fileEntry.linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
        fileEntry.created = fileEntry.created > fileCommit.created ? fileCommit.created : fileEntry.created;
        return acc;
    }, {}));
}
exports.fileChurnDictionary = fileChurnDictionary;
//# sourceMappingURL=file-churn-aggregate.js.map