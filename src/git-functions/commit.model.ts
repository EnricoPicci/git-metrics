import { GIT_CONFIG } from "./config";
import { renamedFilePath } from "./file-path";

export interface CommitCompact {
    sha: string;
    date: Date;
    author: string,
    subject: string,
    repo: string,
}

export interface CommitCompactWithUrlAndParentDate extends CommitCompact {
    commitUrl: string,
    parentDate: Date,
}

export interface CommitPair {
    repoPath: string,
    yearMonth: string,
    mostRecentCommitDate: string,
    commitPair: [CommitCompact, CommitCompact]
}

// Data about a committed file produced with the --numstat option
// https://git-scm.com/docs/git-log
export type GitFileNumstat = {
    linesAdded: number | undefined; // undefined in case of binary files,
    linesDeleted: number | undefined; // undefined in case of binary files
    path: string;
};
function newGitFileNumstat(fileData: string) {
    const fileNumstatData = fileData.split('\t');
    if (fileNumstatData.length !== 3) {
        throw new Error('File numstat data not in the form of numAddedLines    numDeletedLines   path \n' + fileData);
    }
    let linesAdded = parseInt(fileNumstatData[0]);
    let linesDeleted = parseInt(fileNumstatData[1]);
    linesAdded = isNaN(linesAdded) ? 0 : linesAdded;
    linesDeleted = isNaN(linesDeleted) ? 0 : linesDeleted;
    const fileNumstat: GitFileNumstat = {
        linesAdded,
        linesDeleted,
        path: renamedFilePath(fileNumstatData[2]),
    };
    return fileNumstat;
}

export type Commit = {
    hashShort: string; // abbreviated commit hash
    authorDate: Date; // author date, RFC2822 style
    authorName: string; // author name (respecting .mailmap, see git-shortlog[1] or git-blame[1])
    committerName: string;
    committerDate: Date;
    subject: string;
    parents: string[];
};

const SEP = GIT_CONFIG.COMMIT_REC_SEP;
export function newCommit(commitRecDataLine: string) {
    if (!commitRecDataLine || commitRecDataLine.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecDataLine);
    }
    const commitData = commitRecDataLine.split(SEP);
    // A commit with parents will be split in 8 parts, the last one being the parents
    // A commit though can also be an "orphan" in which case it does not have any parent and therefore will be split in 7 parts
    if (commitData.length !== 7 && commitData.length !== 8) {
        throw new Error(
            `Commit Record data not in the form of ${SEP}shortHash${SEP}authorDate${SEP}authorName${SEP}commiterName${SEP}commiterDate${SEP}subject${SEP}subject${SEP}parent
${commitRecDataLine} (length ${commitData.length})`,
        );
    }
    const commit: Commit = {
        hashShort: commitData[1],
        authorDate: new Date(commitData[2]),
        authorName: commitData[3],
        committerName: commitData[4],
        committerDate: new Date(commitData[5]),
        subject: commitData[6],
        parents: commitData[7].split(' '),
    };
    return commit;
}

export type CommitWithFileNumstats = Commit & { files: GitFileNumstat[]; }
export function newCommitWithFileNumstats(commitRecData: string[]) {
    if (!commitRecData || commitRecData.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecData);
    }
    const firstLine = commitRecData[0];
    const _commit = newCommit(firstLine)
    const files = commitRecData.slice(1).map((line) => newGitFileNumstat(line));
    const commit: CommitWithFileNumstats = { ..._commit, files };
    return commit;
}
