export type GitCommandParams = {
    repoFolderPath: string;
    outDir: string;
    outFile?: string;
};

export type GitLogCommitParams = {
    after?: string;
    before?: string;
    filter?: string[];
    outFilePrefix?: string;
    noRenames?: boolean;
    reverse?: boolean;
    includeMergeCommits?: boolean;
    firstParent?: boolean;
} & GitCommandParams;