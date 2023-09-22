"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileChurnDictionary = exports.fileChurn = void 0;
const operators_1 = require("rxjs/operators");
// receives a stream of FileGitCommitEnriched objects and returns a stream of FileChurn objects
function fileChurn(fileCommits, ignoreClocZero, after) {
    return fileChurnDictionary(fileCommits, ignoreClocZero, after).pipe((0, operators_1.map)((fileChurnDictionary) => {
        return Object.values(fileChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
    }));
}
exports.fileChurn = fileChurn;
// returns a dictionary whose key is the file path and the value is a FileChurn object with all properties filled
// exported for testing purposes only
function fileChurnDictionary(fileCommits, ignoreClocZero, after) {
    return fileCommits.pipe((0, operators_1.reduce)((acc, fileCommit) => {
        // ignore files with no cloc
        if (ignoreClocZero && !fileCommit.cloc) {
            return acc;
        }
        const fPath = fileCommit.path;
        if (!acc[fPath]) {
            acc[fPath] = {
                path: fPath,
                cloc: fileCommit.cloc,
                commits: 0,
                linesAddDel: 0,
                linesAdded: 0,
                linesDeleted: 0,
                created: new Date(),
                lastCommit: new Date(),
            };
        }
        const fileEntry = acc[fPath];
        fileEntry.created = fileEntry.created > fileCommit.created ? fileCommit.created : fileEntry.created;
        fileEntry.lastCommit =
            fileEntry.lastCommit < fileCommit.committerDate ? fileCommit.committerDate : fileEntry.lastCommit;
        if (!after || fileCommit.committerDate >= after) {
            fileEntry.commits++;
            fileEntry.linesAdded = fileEntry.linesAdded + ((fileCommit.linesAdded || 0) || 0);
            fileEntry.linesDeleted = fileEntry.linesDeleted + ((fileCommit.linesDeleted || 0) || 0);
            fileEntry.linesAddDel = fileEntry.linesAddDel + ((fileCommit.linesAdded || 0) || 0) + ((fileCommit.linesDeleted || 0) || 0);
        }
        return acc;
    }, {}));
}
exports.fileChurnDictionary = fileChurnDictionary;
//# sourceMappingURL=file-churn-aggregate.js.map