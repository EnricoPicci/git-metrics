"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCommitWithFileNumstats = exports.newCommit = void 0;
const config_1 = require("../config");
const config_2 = require("./config");
const file_path_1 = require("./file-path");
function newGitFileNumstat(fileData) {
    const fileNumstatData = fileData.split('\t');
    if (fileNumstatData.length !== 3) {
        throw new Error('File numstat data not in the form of numAddedLines    numDeletedLines   path \n' + fileData);
    }
    let linesAdded = parseInt(fileNumstatData[0]);
    let linesDeleted = parseInt(fileNumstatData[1]);
    linesAdded = isNaN(linesAdded) ? 0 : linesAdded;
    linesDeleted = isNaN(linesDeleted) ? 0 : linesDeleted;
    const fileNumstat = {
        linesAdded,
        linesDeleted,
        path: (0, file_path_1.renamedFilePath)(fileNumstatData[2]),
    };
    return fileNumstat;
}
const SEP = config_2.GIT_CONFIG.COMMIT_REC_SEP;
function newCommit(commitRecDataLine) {
    if (!commitRecDataLine || commitRecDataLine.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecDataLine);
    }
    const commitData = commitRecDataLine.split(SEP);
    // A commit with parents will be split in 8 parts, the last one being the parents
    // A commit though can also be an "orphan" in which case it does not have any parent and therefore will be split in 7 parts
    if (commitData.length !== 7 && commitData.length !== 8) {
        throw new Error(`Commit Record data not in the form of ${SEP}shortHash${SEP}authorDate${SEP}authorName${SEP}commiterName${SEP}commiterDate${SEP}subject${SEP}subject${SEP}parent
${commitRecDataLine} (length ${commitData.length})`);
    }
    const commit = {
        hashShort: commitData[1],
        authorDate: new Date(commitData[2]),
        authorName: commitData[3],
        committerName: commitData[4],
        committerDate: new Date(commitData[5]),
        subject: commitData[6].replaceAll(config_1.CONFIG.CSV_SEP, config_1.CONFIG.CVS_SEP_SUBSTITUE),
        parents: commitData[7].split(' '),
    };
    return commit;
}
exports.newCommit = newCommit;
function newCommitWithFileNumstats(commitRecData) {
    if (!commitRecData || commitRecData.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecData);
    }
    const firstLine = commitRecData[0];
    const _commit = newCommit(firstLine);
    const files = commitRecData.slice(1).map((line) => newGitFileNumstat(line));
    const commit = Object.assign(Object.assign({}, _commit), { files });
    return commit;
}
exports.newCommitWithFileNumstats = newCommitWithFileNumstats;
//# sourceMappingURL=commit.model.js.map