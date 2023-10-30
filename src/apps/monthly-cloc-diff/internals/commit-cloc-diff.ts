import { of, map, from, mergeMap, reduce } from 'rxjs';

import { clocDiff$ } from '../../../cloc-functions/cloc-diff';
import { newDiffsClocDiffStats, ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';
import { CONFIG } from '../../../config';

import { CommitTuple } from './commit-tuple.model';
import { RepoMonthlyClocDiffStats } from './commit-cloc-diff.model';

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
