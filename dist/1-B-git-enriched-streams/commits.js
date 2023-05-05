"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCommits = exports.splitCommits = exports.COMMIT_RECORD_COUNTER = exports.newGitCommit = exports.gitCommitStream = exports.commitsStream = exports.enrichedCommitsStream = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const read_cloc_log_1 = require("./read-cloc-log");
const config_1 = require("../0-config/config");
const SEP = config_1.DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// returns a stream of commits in the form of an Observable which notifies GitCommitEnriched objects reading data from files containing
// the git log and cloc data
function enrichedCommitsStream(commitLogPath, clocLogPath, after) {
    const commitStream = (0, read_cloc_log_1.clocFileDict)(clocLogPath).pipe((0, operators_1.concatMap)((clocDict) => gitCommitStream(commitLogPath, clocDict)));
    return after ? commitStream.pipe((0, operators_1.filter)((c) => c.committerDate > after)) : commitStream;
}
exports.enrichedCommitsStream = enrichedCommitsStream;
function commitsStream(commitLogPath) {
    return gitCommitStream(commitLogPath);
}
exports.commitsStream = commitsStream;
// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
function gitCommitStream(logFilePath, clocDict) {
    return splitCommits(logFilePath).pipe((0, operators_1.map)((commit) => newGitCommit(commit, clocDict)));
}
exports.gitCommitStream = gitCommitStream;
function newGitCommit(commitRecInfo, clocDict) {
    if (!commitRecInfo || commitRecInfo.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecInfo);
    }
    const firstLine = commitRecInfo[0];
    const commitData = firstLine.split(SEP);
    // A commit with parents will be split in 8 parts, the last one being the parents
    // A commit though can also be an "orphan" in which case it does not have any parent and therefore will be split in 7 parts
    if (commitData.length !== 7 && commitData.length !== 8) {
        throw new Error(`Commit Record data not in the form of ${SEP}shortHash${SEP}authorDate${SEP}authorName${SEP}commiterName${SEP}commiterDate${SEP}subject${SEP}subject${SEP}parent
${firstLine} (length ${commitData.length})`);
    }
    const files = commitRecInfo.slice(1).map((line) => newGitFileNumstat(line, clocDict));
    const commitRec = {
        hashShort: commitData[1],
        authorDate: new Date(commitData[2]),
        authorName: commitData[3],
        committerName: commitData[4],
        committerDate: new Date(commitData[5]),
        subject: commitData[6],
        parents: commitData[7].split(' '),
        files,
    };
    return commitRec;
}
exports.newGitCommit = newGitCommit;
function newGitFileNumstat(fileInfo, clocDict) {
    const fileNumstatData = fileInfo.split('\t');
    if (fileNumstatData.length !== 3) {
        throw new Error('File numstat data not in the form of numAddedLines    numDeletedLines   path \n' + fileInfo);
    }
    let linesAdded = parseInt(fileNumstatData[0]);
    let linesDeleted = parseInt(fileNumstatData[1]);
    linesAdded = isNaN(linesAdded) ? 0 : linesAdded;
    linesDeleted = isNaN(linesDeleted) ? 0 : linesDeleted;
    const fileNumstat = {
        linesAdded,
        linesDeleted,
        path: fileNumstatData[2],
        cloc: 0,
        comment: 0,
        blank: 0,
    };
    if (clocDict) {
        const _path = `${fileNumstat.path}`;
        // it may be that cloc does not read info for files which are considered not relevant, e.g. *.txt or files without extensions
        // such files though may be tracked by git, therefore we need to check that the file path is actually one of the keys of the
        // dictionary built with cloc
        if (clocDict[_path]) {
            fileNumstat.cloc = clocDict[_path].code;
            fileNumstat.comment = clocDict[_path].comment;
            fileNumstat.blank = clocDict[_path].blank;
        }
    }
    return fileNumstat;
}
// counter of the lines in the file containing the commit log
exports.COMMIT_RECORD_COUNTER = { numberOfCommitLines: 0, count: false };
// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
// exported for testing purposes only
function splitCommits(logFilePath) {
    let _readLineObs = (0, observable_fs_1.readLineObs)(logFilePath);
    _readLineObs = exports.COMMIT_RECORD_COUNTER.count
        ? _readLineObs.pipe((0, operators_1.tap)({
            next: () => {
                exports.COMMIT_RECORD_COUNTER.numberOfCommitLines++;
            },
        }))
        : _readLineObs;
    return _readLineObs.pipe((0, operators_1.filter)((line) => line.length > 0), toCommits(logFilePath));
}
exports.splitCommits = splitCommits;
// Custom operator which splits the content of a git log into buffers of lines whereeach buffer contains all the info
// relative to a single git commit
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
function toCommits(logFilePath) {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let buffer;
            const subscription = source.subscribe({
                next: (line) => {
                    const isStartOfBuffer = line.length > 0 && line.slice(0, SEP.length) === SEP;
                    if (isStartOfBuffer) {
                        if (buffer) {
                            subscriber.next(buffer);
                        }
                        buffer = [];
                    }
                    buffer.push(line);
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    if (!buffer) {
                        const logPathMsg = logFilePath ? `in file ${logFilePath}` : '';
                        subscriber.error(`!!!!!!!!!!!!! >>>>  No commits found ${logPathMsg}`);
                    }
                    subscriber.next(buffer);
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
exports.toCommits = toCommits;
// ALTERNATIVE VERSION
// This is an alternative version of the above function which does use only rxJs operators and not custom operators
//
// export function splitCommits(logFilePath: string) {
//     let buffer: string[] = [];
//     const lastCommit = new Subject<Array<string>>();
//     const _commits = readLineObs(logFilePath).pipe(
//         filter((line) => line.length > 0),
//         map((line) => {
//             if (line.slice(0, SEP.length) === SEP) {
//                 const commit = buffer;
//                 buffer = [line];
//                 return commit;
//             }
//             buffer.push(line);
//             return null;
//         }),
//         filter((buffer) => !!buffer),
//         tap({
//             complete: () => {
//                 lastCommit.next(buffer);
//                 lastCommit.complete();
//             },
//         }),
//         skip(1),
//     );
//     return merge(_commits, lastCommit);
// }
//# sourceMappingURL=commits.js.map