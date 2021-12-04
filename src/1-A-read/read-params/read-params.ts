export type ConfigReadGit = {
    repoFolderPath: string;
    outDir: string;
    outFile?: string;
};

export type ConfigReadCommits = {
    after?: string;
    before?: string;
    filter?: string[];
    outFilePrefix?: string;
    noRenames?: boolean;
    reverse?: boolean;
    includeMergeCommits?: boolean;
    firstParent?: boolean;
} & ConfigReadGit;

export type ConfigReadMultiReposCommits = {
    repoFolderPaths: string[];
    after?: string;
    filter: string[];
    outDir: string;
    outFilePrefix?: string;
};

export type ConfigReadTags = ConfigReadGit;

export type ConfigReadBrachesGraph = ConfigReadGit;

export type ConfigReadCloc = {
    repoFolderPath: string;
    outDir: string;
    outClocFile?: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
};

export type ConfigReadMultiCloc = {
    repoFolderPaths: string[];
    outDir: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
};
