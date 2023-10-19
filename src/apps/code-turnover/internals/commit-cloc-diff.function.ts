import { concatMap, catchError, of, map, from, mergeMap, reduce } from 'rxjs';

import { clocDiff$ } from '../../../cloc-functions/cloc-diff';
import { newDiffsClocDiffStats, ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';
import { readOneCommitCompact$, newEmptyCommitCompact } from '../../../git-functions/commit';
import { CommitCompact } from '../../../git-functions/commit.model';
import { getRemoteOriginUrl$, gitHttpsUrlFromGitUrl } from '../../../git-functions/repo';
import { CONFIG } from '../../../config';

import { yearMonthFromDate } from './commits-by-month.functions';
import { CommitTuple } from './commit-tuple.model';
import { RepoMonthlyClocDiffStats } from './commit-cloc-diff.model';
import { CommitDiffStats } from '../core/code-turnover.model';

// calculateClocGitDiffsChildParent is a function that receives a CommitCompact object and calculates the cloc diff
// and returns an object with the yearMonth, the commit date and the cloc diff
export function calculateClocGitDiffsChildParent(
    commit: CommitCompact,
    repoPath: string,
    options: CalculateClocGitDiffsChildParentOptions,
) {
    const { languages, removeBlanks, removeNFiles, removeComments: removeComment, removeSame } = options
    const childCommitSha = commit.sha;
    const parentCommitSha = `${childCommitSha}^1`;
    console.log(`Starting diff for ${repoPath} -- Date: ${commit.date.toLocaleDateString()}`);
    return clocDiff$(childCommitSha, parentCommitSha, repoPath, languages).pipe(
        concatMap((clocDiff) => {
            delete (clocDiff.diffs as any).header;
            Object.values(clocDiff.diffs).forEach((diff) => {
                Object.values(diff).forEach((diffForLanguage) => {
                    if (removeBlanks) delete diffForLanguage.blank;
                    if (removeComment) delete diffForLanguage.comment;
                    if (removeNFiles) delete diffForLanguage.nFiles;
                })
            })
            if (removeSame) clocDiff.diffs.same = {};
            // we read the parent of the child commit so that we can get the date of the parent commit
            return readOneCommitCompact$(parentCommitSha, repoPath).pipe(
                catchError(() => {
                    // in case of error we return an empty commit
                    return of(newEmptyCommitCompact());
                }),
                map((parentCommit) => {
                    return { clocDiff, parentCommit };
                }),
                map(({ clocDiff, parentCommit }) => {
                    const parentCommitDate = parentCommit.date.toLocaleDateString();
                    const commitStats: CommitDiffStats = {
                        repoPath,
                        yearMonth: yearMonthFromDate(commit.date),
                        mostRecentCommitDate: commit.date.toLocaleDateString(),
                        leastRecentCommitDate: parentCommitDate,
                        comment: commit.subject,
                        clocDiff,
                        remoteOriginUrl: '',
                    };
                    return commitStats;
                }),
            );
        }),
        concatMap((stat) => {
            // we read the remoteOriginUrl of the repo
            return getRemoteOriginUrl$(stat.repoPath).pipe(
                map((remoteOriginUrl) => {
                    remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl);
                    stat.remoteOriginUrl = remoteOriginUrl;
                    return stat;
                }),
            );
        }),
    );
}
/**
 * Represents the options for the `calculateClocGitDiffsChildParent` function.
 * @param languages An array of languages for which to calculate the cloc diffs - the empty array means that all languages are considered.
 * @param removeBlanks Whether to remove the stats about the blank lines.
 * @param removeNFiles Whether to remove the stats about the number of files added, removed or modified.
 * @param removeComments Whether to remove the stats about the comments added, removed or modified.
 * @param removeSame Whether to remove stats about the liens of code which have remained the same.
 */
export type CalculateClocGitDiffsChildParentOptions = {
    languages: string[],
    removeBlanks: boolean,
    removeNFiles: boolean,
    removeComments: boolean,
    removeSame: boolean,
}

// calculateMonthlyClocGitDiffs is a function that receives an object with the path to a repo and an array of commit pairs
// and an array of languagues we are interested in
// and returns an object with the repoPath and a dictionary where the keys are the yearMonth and the values
// are the cloc diff between the two commits
export function calculateMonthlyClocGitDiffs(
    repoMonthlyCommitPairs: {
        repoPath: string;
        commitPairs: {
            [yearMonth: string]: CommitTuple;
        };
    },
    languages: string[],
) {
    const repoPath = repoMonthlyCommitPairs.repoPath;
    return from(Object.entries(repoMonthlyCommitPairs.commitPairs)).pipe(
        mergeMap(([yearMonth, commitPair]: [string, CommitTuple]) => {
            console.log(`Starting diff for ${yearMonth}-${repoPath}`);
            const diffObs = commitPair
                ? // the first commit is the most recent one
                clocDiff$(commitPair[0].sha, commitPair[1].sha, repoPath, languages)
                : of(newDiffsClocDiffStats(languages));
            return diffObs.pipe(
                map((clocDiff) => {
                    console.log(`Completed diff for ${yearMonth}-${repoPath}`);
                    return { yearMonth, clocDiff };
                }),
            );
        }, CONFIG.CONCURRENCY),
        reduce((acc, { yearMonth, clocDiff }) => {
            acc[yearMonth] = clocDiff;
            return acc;
        }, {} as { [yearMonth: string]: ClocDiffStats }),
        map((clocDiffStats) => {
            const repoClocDiffStats: RepoMonthlyClocDiffStats = { repoPath, clocDiffStats };
            return repoClocDiffStats;
        }),
    );
}
