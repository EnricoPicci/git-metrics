export type ConfigReadCloc = {
    repoFolderPath: string;
    outDir: string;
    outClocFile?: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
    vcs?: string;
};

export type ConfigReadMultiCloc = {
    repoFolderPaths: string[];
    outDir: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
};
