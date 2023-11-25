export type ClocParams = {
    folderPath: string;
    outDir?: string;
    outClocFile?: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
    vcs: string;
    notMatch?: string[];
};
