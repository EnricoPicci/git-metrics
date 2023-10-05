import { ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';


export type CommitDiffStats = {
    remoteOriginUrl: string;
    repoPath: string;
    yearMonth: string;
    mostRecentCommitDate: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
};
