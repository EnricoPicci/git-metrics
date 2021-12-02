import { Observable, Subscriber } from 'rxjs';
import { map, filter, concatMap, tap } from 'rxjs/operators';
import { readLineObs } from 'observable-fs';
import { SEP } from '../config/default-git-log-separator';
import { ClocDictionary, clocFileDict } from './read-cloc-log';
import { GitCommitEnriched, GitFileNumstatEnriched } from '../git-enriched-types/git-types';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

// returns a stream of commits in the form of an Observable which notifies GitCommitEnriched objects reading data from files containing
// the git log and cloc data
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
    const commitRec: GitCommitEnriched = {
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
    const fileNumstat: GitFileNumstatEnriched = {
        linesAdded,
        linesDeleted,
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
        _splitCommit(logFilePath),
    );
}
// Custom operator which splits the content of a git log into buffers of lines whereeach buffer contains all the info
// relative to a single git commit
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
function _splitCommit(logFilePath: string) {
    return (source: Observable<string>) => {
        return new Observable((subscriber: Subscriber<string[]>) => {
            let buffer: string[];
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
                        subscriber.error(`!!!!!!!!!!!!! >>>>  No commits found in file ${logFilePath}`);
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
