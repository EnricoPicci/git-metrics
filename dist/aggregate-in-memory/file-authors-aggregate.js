"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAuthorsDictionary = exports.fileAuthors = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
// reads a commitLog and the cloc data from log files and returns a stream of FileAuthors objects
function fileAuthors(fileCommits, after) {
    return fileAuthorsDictionary(fileCommits, after).pipe((0, operators_1.concatMap)((fileWithAuthorsDict) => {
        const _fileAuthors = Object.values(fileWithAuthorsDict).sort((a, b) => b.authors - a.authors);
        return (0, rxjs_1.from)(_fileAuthors);
    }));
}
exports.fileAuthors = fileAuthors;
// returns a dictionary whose key is the the file path and the value is an object of type FileAuthors
// exported for testing purposes only
function fileAuthorsDictionary(fileCommits, after) {
    return fileCommits.pipe(
    // first group the fileCommits per file and author
    (0, operators_1.reduce)((fileDict, fileCommit) => {
        var _a;
        if (fileCommit.committerDate < after) {
            return fileDict;
        }
        if (!fileDict[fileCommit.path]) {
            fileDict[fileCommit.path] = {};
        }
        const fileAuthorDict = fileDict[fileCommit.path];
        if (!fileAuthorDict[fileCommit.authorName]) {
            fileAuthorDict[fileCommit.authorName] = {
                path: fileCommit.path,
                authorName: fileCommit.authorName,
                cloc: (_a = fileCommit.cloc) !== null && _a !== void 0 ? _a : 0,
                linesAdded: 0,
                linesDeleted: 0,
                linesAddDel: 0,
                commits: 0,
                created: new Date(),
            };
        }
        fileAuthorDict[fileCommit.authorName].linesAdded =
            fileAuthorDict[fileCommit.authorName].linesAdded + fileCommit.linesAdded;
        fileAuthorDict[fileCommit.authorName].linesDeleted =
            fileAuthorDict[fileCommit.authorName].linesDeleted + fileCommit.linesDeleted;
        fileAuthorDict[fileCommit.authorName].linesAddDel =
            fileAuthorDict[fileCommit.authorName].linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
        fileAuthorDict[fileCommit.authorName].commits = fileAuthorDict[fileCommit.authorName].commits + 1;
        fileAuthorDict[fileCommit.authorName].created =
            fileAuthorDict[fileCommit.authorName].created > fileCommit.committerDate
                ? fileCommit.committerDate
                : fileAuthorDict[fileCommit.authorName].created;
        return fileDict;
    }, {}), (0, operators_1.map)((fileDict) => {
        // for each file we scan all the authors who have committed at least once this file and calculate some data
        // among which how many authors a certain file has had
        return Object.entries(fileDict).reduce((fileWithAuthorsDict, val) => {
            const [path, fileAuthorDict] = val;
            const firstFile = Object.values(fileAuthorDict)[0];
            if (fileWithAuthorsDict[path]) {
                // this is a check just to make sure that if the logic is wrong we get to know it asap
                throw new Error(`Unxpected double occurrence of path "${path}" in dictionary ${fileDict}`);
            }
            if (!firstFile) {
                // this is a check just to make sure that if the logic is wrong we get to know it asap
                throw new Error(`We expect always at least a file for an author, but for the key "${path}" in dictionary ${fileDict} we find an empty dictionary`);
            }
            fileWithAuthorsDict[path] = {
                path,
                cloc: firstFile.cloc,
                authors: 0,
                commits: 0,
                linesAdded: 0,
                linesDeleted: 0,
                linesAddDel: 0,
                created: new Date(),
            };
            // we loop through each author who has committed this file at least once and calculate the data for the file
            const fileWithAuthorsVal = fileWithAuthorsDict[path];
            Object.values(fileAuthorDict).forEach((v) => {
                fileWithAuthorsVal.authors++;
                fileWithAuthorsVal.commits = fileWithAuthorsVal.commits + v.commits;
                fileWithAuthorsVal.linesAdded = fileWithAuthorsVal.linesAdded + v.linesAdded;
                fileWithAuthorsVal.linesDeleted = fileWithAuthorsVal.linesDeleted + v.linesDeleted;
                fileWithAuthorsVal.linesAddDel = fileWithAuthorsVal.linesAddDel + v.linesAddDel;
                fileWithAuthorsVal.created =
                    fileWithAuthorsVal.created > v.created ? v.created : fileWithAuthorsVal.created;
            });
            return fileWithAuthorsDict;
        }, {});
    }));
}
exports.fileAuthorsDictionary = fileAuthorsDictionary;
//# sourceMappingURL=file-authors-aggregate.js.map