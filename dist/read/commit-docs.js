"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newGitCommit = exports.gitCommitStream = void 0;
const rxjs_1 = require("rxjs");
const commits_1 = require("./commits");
const read_git_1 = require("./read-git");
// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
function gitCommitStream(logFilePath, clocDict) {
    return (0, commits_1.splitCommits)(logFilePath).pipe((0, rxjs_1.map)((commit) => newGitCommit(commit, clocDict)));
}
exports.gitCommitStream = gitCommitStream;
function newGitCommit(commitRecInfo, clocDict) {
    if (!commitRecInfo || commitRecInfo.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecInfo);
    }
    const firstLine = commitRecInfo[0];
    const commitData = firstLine.split(read_git_1.SEP);
    const bodyEndsWithDoubleDash = commitData.length === 8 && commitData[7] === '';
    if (commitData.length !== 7 && !bodyEndsWithDoubleDash) {
        throw new Error(`Commit Record data not in the form of ${read_git_1.SEP}shortHash${read_git_1.SEP}authorDate${read_git_1.SEP}authorName${read_git_1.SEP}commiterName${read_git_1.SEP}commiterDate${read_git_1.SEP}subject${read_git_1.SEP}body
${firstLine} (length ${commitData.length})`);
    }
    const files = commitRecInfo.slice(1).map((line) => newGitFileNumstat(line, clocDict));
    const commitRec = {
        hashShort: commitData[1],
        authorDate: new Date(commitData[2]),
        authorName: commitData[3],
        commiterName: commitData[4],
        commiterDate: new Date(commitData[5]),
        subject: commitData[6],
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
    const fileNumstat = {
        linesAdded: parseInt(fileNumstatData[0]),
        linesDeleted: parseInt(fileNumstatData[1]),
        path: fileNumstatData[2],
    };
    if (clocDict) {
        // the keys of the clocDict are assumed to start with "./"
        const _path = `./${fileNumstat.path}`;
        // it may be that cloc does not read info for files which are considered not relevant, e.g. *.txt or files withou extensions
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
//# sourceMappingURL=commit-docs.js.map