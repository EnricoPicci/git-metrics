"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCommits = exports.COMMIT_RECORD_COUNTER = exports.newGitCommit = exports.gitCommitStream = exports.enrichedCommitsStream = void 0;
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const cloc_dictionary_1 = require("../../../cloc-functions/cloc-dictionary");
const commit_1 = require("../../../git-functions/commit");
const config_1 = require("../0-config/config");
const file_path_1 = require("../../../git-functions/file-path");
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
        path: (0, file_path_1.renamedFilePath)(fileNumstatData[2]),
        code: 0,
        comment: 0,
        blank: 0,
    };
    if (clocDict) {
        let _path = fileNumstat.path;
        _path = (0, file_path_1.renamedFilePath)(_path);
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