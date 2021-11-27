export type CommitDaylySummary = {
    day: string;
    commitHashes: string[];
    numberOfCommits: number;
    // branch tips, i.e. tips which are child and not parent of any other comit, at the end of the day
    branchTips: string[];
    // difference between the branch tips of the day before and the branch tips at the end of the day
    // proxy measure of the attitude to create branches or merge branches
    deltaBranchTips: number;
    // // number of additional branch tips created - an additional branch tip is a commit whose parent is already the parent of another commit
    // numberOfAdditionalBranchTipsCreatedInTheDay: number;
    // number of commits merged in the day
    numberOfCommitsMergedInTheDay: number;
    // branch tips available at the end of the day which represent branches which are still available as branches now
    // these are the commits which are not going to have any children up until the end of the period analyzed
    commitsWithNoFutureChildren?: string[];
    numberOfCommitsWithNoFutureChildren: number;
    // number of commits that represent branch tips at the end of the summary day but that at some point will have some children
    numberOfBranchTipsWhichWillHaveChildren: number;
    //
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
};
