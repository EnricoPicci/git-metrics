export type ReadGitParams = {
    repoFolderPath: string;
    outDir: string;
    outFile?: string;
};

export type ReadGitCommitParams = {
    after?: string;
    before?: string;
    filter?: string[];
    outFilePrefix?: string;
    noRenames?: boolean;
    reverse?: boolean;
    includeMergeCommits?: boolean;
    firstParent?: boolean;
} & ReadGitParams;