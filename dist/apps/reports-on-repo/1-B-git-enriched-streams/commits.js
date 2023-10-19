"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCommits = exports.COMMIT_RECORD_COUNTER = exports.filePathFromCommitPath = exports.newGitCommit = exports.gitCommitStream = exports.enrichedCommitsStream = void 0;
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const cloc_dictionary_1 = require("../../../cloc-functions/cloc-dictionary");
const commit_1 = require("../../../git-functions/commit");
const config_1 = require("../0-config/config");
const SEP = config_1.DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// returns a stream of commits in the form of an Observable which notifies GitCommitEnriched objects reading data from files containing
// the git log and cloc data (commit data read from the git repo are enriched with data coming from the cloc tool)
function enrichedCommitsStream(commitLogPath, clocLogPath, after) {
    const commitStream = (0, cloc_dictionary_1.clocFileDictFromClocLogFile$)(clocLogPath).pipe((0, operators_1.concatMap)((clocDict) => gitCommitStream(commitLogPath, clocDict)));
    return after ? commitStream.pipe((0, operators_1.filter)((c) => c.committerDate > after)) : commitStream;
}
exports.enrichedCommitsStream = enrichedCommitsStream;
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
        path: filePathFromCommitPath(fileNumstatData[2]),
        code: 0,
        comment: 0,
        blank: 0,
    };
    if (clocDict) {
        let _path = fileNumstat.path;
        _path = filePathFromCommitPath(_path);
        const pathWithStartingDotSlash = './' + _path;
        const clocFileInfo = clocDict[_path] || clocDict[pathWithStartingDotSlash];
        // it may be that cloc does not read info for files which are considered not relevant, e.g. *.txt or files without extensions
        // or old files which are not part of the current project. These files will not be in the cloc dictionary. Some of
        // such files though may be tracked by git, therefore we need to check that the file path is actually one of the keys of the
        // dictionary built with cloc
        if (clocFileInfo) {
            fileNumstat.code = clocFileInfo.code;
            fileNumstat.comment = clocFileInfo.comment;
            fileNumstat.blank = clocFileInfo.blank;
        }
    }
    return fileNumstat;
}
// In case of rename the file path braces adn '=>' fat arrow are used like in these examples:
//// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
//// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
//// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
//// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
//// clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
//
// This function returns the path part only with the rename part removed
// Exported for testing purposes only
function filePathFromCommitPath(fPath) {
    // if fPath contains ' => ' then it is a rename
    const pathParts = fPath.split(' => ');
    if (pathParts.length === 2) {
        // manages the case where the rename is in the form of 'oldPath => newPath' with no braces like this:
        // metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
        if (!pathParts[0].includes('{')) {
            // we expect no occurrences of '}' in the second part
            if (pathParts[1].includes('}')) {
                console.error(`ERROR: we found an '}' without an '{' in ${fPath}`);
                return fPath;
            }
            return pathParts[1];
        }
        const parts_0 = pathParts[0].split('{');
        const parts_1 = pathParts[1].split('}');
        // we expect only 1 occurrence of '{' in the first piece and only 1 occurrence of '}' in the second piece
        if (parts_0.length != 2 || parts_1.length != 2) {
            console.error(`ERROR: in case of rename there should be exactly one '{' and one '}' - instead found ${fPath}`);
            return fPath;
        }
        const firstPathPart = parts_0[0];
        // if the second part starts with a '/' then we need to remove it - example
        // clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
        const secondPathPart = parts_1[0] === '' ? parts_1[1].slice(1) : parts_1[0] + parts_1[1];
        return firstPathPart + secondPathPart;
    }
    return fPath;
}
exports.filePathFromCommitPath = filePathFromCommitPath;
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
    return _readLineObs.pipe((0, operators_1.filter)((line) => line.length > 0), (0, commit_1.commitLines)(logFilePath));
}
exports.splitCommits = splitCommits;
//# sourceMappingURL=commits.js.map