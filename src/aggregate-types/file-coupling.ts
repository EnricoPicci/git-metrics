export type FileCoupling = {
    path: string;
    totCommitForFile: number;
    cloc?: number;
    linesAdded: number;
    linesDeleted: number;
    coupledFile: string;
    totCommitsForCoupledFile: number;
    howManyTimes: number;
    howManyTimes_vs_totCommits?: number;
    totNumberOfCommits: number;
};
