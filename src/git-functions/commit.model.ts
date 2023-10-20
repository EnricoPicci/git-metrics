import { GIT_CONFIG } from "./config";

export interface CommitCompact {
    sha: string;
    date: Date;
    author: string,
    subject: string,
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
        path: filePathFromCommitPath(fileNumstatData[2]),
    };
    return fileNumstat;
}

// In case of rename the file path braces and '=>' fat arrow are used like in these examples:
//// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
//// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
//// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
//// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
//// clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java
//
// This function returns the path part only with the rename part removed
// Exported for testing purposes only
export function filePathFromCommitPath(fPath: string) {
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
            console.error(
                `ERROR: in case of rename there should be exactly one '{' and one '}' - instead found ${fPath}`,
            );
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
