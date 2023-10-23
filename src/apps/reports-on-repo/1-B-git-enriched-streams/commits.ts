import { map, filter, concatMap, tap } from 'rxjs/operators';
import { readLineObs } from 'observable-fs';

import { clocFileDictFromClocLogFile$ } from '../../../cloc-functions/cloc-dictionary';
import { ClocDictionary } from '../../../cloc-functions/cloc-dictionary.model';
import { commitLines } from '../../../git-functions/commit';
import { CommitWithFileNumstatsEnrichedWithCloc, GitFileNumstatEnrichedWithCloc } from '../../../git-cloc-functions/commit-cloc.model';

import { DEFAUL_CONFIG } from '../0-config/config';
import { filePathFromCommitPath } from '../../../git-functions/commit.model';

const SEP = DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

// returns a stream of commits in the form of an Observable which notifies GitCommitEnriched objects reading data from files containing
// the git log and cloc data (commit data read from the git repo are enriched with data coming from the cloc tool)
export function enrichedCommitsStream(commitLogPath: string, clocLogPath: string, after?: Date) {
    const commitStream = clocFileDictFromClocLogFile$(clocLogPath).pipe(
        concatMap((clocDict) => gitCommitStream(commitLogPath, clocDict)),
    );
    return after ? commitStream.pipe(filter((c) => c.committerDate > after)) : commitStream;
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

        const pathWithStartingDotSlash = './' + _path;
        const clocFileInfo = clocDict[_path] || clocDict[pathWithStartingDotSlash]
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
