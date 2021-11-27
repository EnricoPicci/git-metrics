"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAuthorsDictionary = exports.fileAuthors = exports.authorCommitsDictionary = exports.authorChurn = exports.fileChurnDictionary = exports.fileChurn = exports.filesStream = exports.commitsStream = exports.commitsWithClocInfoStream = exports.readAndGenerateCommitsStream = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const cloc_1 = require("./cloc");
const commit_docs_1 = require("./commit-docs");
const read_all_1 = require("./read-all");
// read the data from a repo folder and returns a stream of commits in the form of an Observable which notifies CommitDocs
function readAndGenerateCommitsStream(commitOptions, readClocOptions) {
    const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    return commitsWithClocInfoStream(commitLogPath, clocLogPath);
}
exports.readAndGenerateCommitsStream = readAndGenerateCommitsStream;
// returns a stream of commits in the form of an Observable which notifies commitDocs reading data from files containing
// the git log and cloc data
function commitsWithClocInfoStream(commitLogPath, clocLogPath, after) {
    const commitStream = (0, cloc_1.clocFileDict)(clocLogPath).pipe((0, operators_1.concatMap)((clocDict) => (0, commit_docs_1.gitCommitStream)(commitLogPath, clocDict)));
    return after ? commitStream.pipe((0, operators_1.filter)((c) => c.authorDate > after)) : commitStream;
}
exports.commitsWithClocInfoStream = commitsWithClocInfoStream;
function commitsStream(commitLogPath) {
    return (0, commit_docs_1.gitCommitStream)(commitLogPath);
}
exports.commitsStream = commitsStream;
// returns a stream of file committed data in the form of an Observable which notifies FileDocs reading data from files containing
// the git log and cloc data
function filesStream(commitLogPath, clocLogPath) {
    return commitsWithClocInfoStream(commitLogPath, clocLogPath).pipe(
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
    (0, operators_1.concatMap)((enrichedFiles) => (0, rxjs_1.from)(enrichedFiles)));
}
exports.filesStream = filesStream;
// reads a commitLog and the cloc data from log files and returns a stream of FileChurn objects
function fileChurn(fileCommits, after) {
    return fileChurnDictionary(fileCommits, after).pipe((0, operators_1.concatMap)((fileChurnDictionary) => {
        const fileChurns = Object.values(fileChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
        return (0, rxjs_1.from)(fileChurns);
    }));
}
exports.fileChurn = fileChurn;
// returns a dictionary whose key is the file path and the value is a FileChurn object with all properties filled
// exported for testing purposes only
function fileChurnDictionary(fileCommits, after) {
    return fileCommits.pipe((0, operators_1.reduce)((acc, fileCommit) => {
        var _a;
        if (fileCommit.authorDate < after) {
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
        acc[fileCommit.path].commits++;
        acc[fileCommit.path].linesAdded = acc[fileCommit.path].linesAdded + fileCommit.linesAdded;
        acc[fileCommit.path].linesDeleted = acc[fileCommit.path].linesDeleted + fileCommit.linesDeleted;
        acc[fileCommit.path].linesAddDel =
            acc[fileCommit.path].linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
        acc[fileCommit.path].created =
            acc[fileCommit.path].created > fileCommit.authorDate
                ? fileCommit.authorDate
                : acc[fileCommit.path].created;
        return acc;
    }, {}));
}
exports.fileChurnDictionary = fileChurnDictionary;
// reads a commitLog and the cloc data from log files and returns a stream of AuthorChurn objects
function authorChurn(commits, fileCommits, after) {
    return authorCommitsDictionary(commits, after).pipe((0, operators_1.concatMap)((authorCommitsDictionary) => {
        return fileCommits.pipe((0, operators_1.reduce)((acc, fileCommit) => {
            if (fileCommit.authorDate < after) {
                return acc;
            }
            if (!acc[fileCommit.authorName]) {
                acc[fileCommit.authorName] = {
                    authorName: fileCommit.authorName,
                    commits: authorCommitsDictionary[fileCommit.authorName],
                    linesAdded: 0,
                    linesDeleted: 0,
                    linesAddDel: 0,
                    firstCommit: undefined,
                    lastCommit: undefined,
                };
            }
            acc[fileCommit.authorName].linesAdded =
                acc[fileCommit.authorName].linesAdded + fileCommit.linesAdded;
            acc[fileCommit.authorName].linesDeleted =
                acc[fileCommit.authorName].linesDeleted + fileCommit.linesDeleted;
            acc[fileCommit.authorName].linesAddDel =
                acc[fileCommit.authorName].linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
            acc[fileCommit.authorName].firstCommit =
                !acc[fileCommit.authorName].firstCommit ||
                    acc[fileCommit.authorName].firstCommit > fileCommit.authorDate
                    ? fileCommit.authorDate
                    : acc[fileCommit.authorName].firstCommit;
            acc[fileCommit.authorName].lastCommit =
                !acc[fileCommit.authorName].lastCommit ||
                    acc[fileCommit.authorName].lastCommit < fileCommit.authorDate
                    ? fileCommit.authorDate
                    : acc[fileCommit.authorName].lastCommit;
            return acc;
        }, {}), (0, operators_1.concatMap)((authorChurnDictionary) => {
            const fileChurns = Object.values(authorChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
            return (0, rxjs_1.from)(fileChurns);
        }));
    }));
}
exports.authorChurn = authorChurn;
// returns a dictionary whose key is the author name and the value is the number of commits made by the author in the period considered
// exported for testing purposes only
function authorCommitsDictionary(commits, after) {
    return commits.pipe((0, operators_1.reduce)((acc, commit) => {
        if (commit.authorDate < after) {
            return acc;
        }
        if (!acc[commit.authorName]) {
            acc[commit.authorName] = 0;
        }
        acc[commit.authorName] = acc[commit.authorName] + 1;
        return acc;
    }, {}));
}
exports.authorCommitsDictionary = authorCommitsDictionary;
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
        if (fileCommit.authorDate < after) {
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
            fileAuthorDict[fileCommit.authorName].created > fileCommit.authorDate
                ? fileCommit.authorDate
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
//# sourceMappingURL=committs-files-streams.js.map