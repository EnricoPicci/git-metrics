import { ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';

// RepoMonthlyClocDiffStats is a type that represents the statistics calculated by the "cloc" tool, with the diff option,
// on a repo
export type RepoMonthlyClocDiffStats = {
    repoPath: string;
    clocDiffStats: {
        [yearMonth: string]: ClocDiffStats;
    };
};
