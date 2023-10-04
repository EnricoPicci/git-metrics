import { ClocDiffStats } from '../../../../cloc-functions/cloc-diff.model';

export type CommitDiffStats = {
    remoteOriginUrl: string;
    repoPath: string;
    yearMonth: string;
    mostRecentCommitDate: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
}

// RepoMonthlyClocDiffStats is a type that represents the statistics calculated by the "cloc" tool, with the diff option,
// on a repo
export type RepoMonthlyClocDiffStats = {
    repoPath: string;
    clocDiffStats: {
        [yearMonth: string]: ClocDiffStats;
    };
};
