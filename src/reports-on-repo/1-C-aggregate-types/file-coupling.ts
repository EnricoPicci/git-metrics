export type FileCoupling = {
    path: string;
    totCommitForFile: number;
    cloc?: number;
    linesAdded: number | undefined; // undefined is for blob files
    linesDeleted: number | undefined; // undefined is for blob files
    coupledFile: string;
    totCommitsForCoupledFile: number;
    howManyTimes: number;
    howManyTimes_vs_totCommits?: number;
    totNumberOfCommits: number;
};
