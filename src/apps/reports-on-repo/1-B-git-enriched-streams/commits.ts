import { map, filter, concatMap, tap } from 'rxjs/operators';
import { readLineObs } from 'observable-fs';
import { ClocDictionary, clocFileDict } from './read-cloc-log';

import { DEFAUL_CONFIG } from '../0-config/config';
import { CommitWithFileNumstatsEnrichedWithCloc, GitFileNumstatEnrichedWithCloc } from '../../../git-cloc-functions/commit-cloc.model';
import { commitLines } from '../../../git-functions/commit.functions';

const SEP = DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

// returns a stream of commits in the form of an Observable which notifies GitCommitEnriched objects reading data from files containing
// the git log and cloc data (commit data read from the git repo are enriched with data coming from the cloc tool)
export function enrichedCommitsStream(commitLogPath: string, clocLogPath: string, after?: Date) {
    const commitStream = clocFileDict(clocLogPath).pipe(
        concatMap((clocDict) => gitCommitStream(commitLogPath, clocDict)),
    );
    return after ? commitStream.pipe(filter((c) => c.committerDate > after)) : commitStream;
}
export function commitsStream(commitLogPath: string) {
    return gitCommitStream(commitLogPath);
}

// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
export function gitCommitStream(logFilePath: string, clocDict?: ClocDictionary) {
    return splitCommits(logFilePath).pipe(map((commit) => newGitCommit(commit, clocDict)));
}

export function newGitCommit(commitRecInfo: string[], clocDict?: ClocDictionary) {
    if (!commitRecInfo || commitRecInfo.length === 0) {
        throw new Error('Commit Record Info null or empty \n' + commitRecInfo);
    }
    const firstLine = commitRecInfo[0];
    const commitData = firstLine.split(SEP);
    // A commit with parents will be split in 8 parts, the last one being the parents
    // A commit though can also be an "orphan" in which case it does not have any parent and therefore will be split in 7 parts
    if (commitData.length !== 7 && commitData.length !== 8) {
        throw new Error(
            `Commit Record data not in the form of ${SEP}shortHash${SEP}authorDate${SEP}authorName${SEP}commiterName${SEP}commiterDate${SEP}subject${SEP}subject${SEP}parent
${firstLine} (length ${commitData.length})`,
        );
    }
    const files = commitRecInfo.slice(1).map((line) => newGitFileNumstat(line, clocDict));
    const commitRec: CommitWithFileNumstatsEnrichedWithCloc = {
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

function newGitFileNumstat(fileInfo: string, clocDict?: ClocDictionary) {
    const fileNumstatData = fileInfo.split('\t');
    if (fileNumstatData.length !== 3) {
        throw new Error('File numstat data not in the form of numAddedLines    numDeletedLines   path \n' + fileInfo);
    }
    let linesAdded = parseInt(fileNumstatData[0]);
    let linesDeleted = parseInt(fileNumstatData[1]);
    linesAdded = isNaN(linesAdded) ? 0 : linesAdded;
    linesDeleted = isNaN(linesDeleted) ? 0 : linesDeleted;
    const fileNumstat: GitFileNumstatEnrichedWithCloc = {
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
        // it may be that cloc does not read info for files which are considered not relevant, e.g. *.txt or files without extensions
        // or old files which are not part of the current project. These files will not be in the cloc dictionary. Some of
        // such files though may be tracked by git, therefore we need to check that the file path is actually one of the keys of the
        // dictionary built with cloc
        if (clocDict[_path]) {
            fileNumstat.code = clocDict[_path].code;
            fileNumstat.comment = clocDict[_path].comment;
            fileNumstat.blank = clocDict[_path].blank;
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

// counter of the lines in the file containing the commit log
export const COMMIT_RECORD_COUNTER = { numberOfCommitLines: 0, count: false };
// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
// exported for testing purposes only
export function splitCommits(logFilePath: string) {
    let _readLineObs = readLineObs(logFilePath);
    _readLineObs = COMMIT_RECORD_COUNTER.count
        ? _readLineObs.pipe(
            tap({
                next: () => {
                    COMMIT_RECORD_COUNTER.numberOfCommitLines++;
                },
            }),
        )
        : _readLineObs;
    return _readLineObs.pipe(
        filter((line) => line.length > 0),
        commitLines(logFilePath),
    );
}
