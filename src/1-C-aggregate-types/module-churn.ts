export type ModuleChurn = {
    path: string;
    cloc: number;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    numFiles: number; // number of files in a module
    created: Date;
};

export function newModuleChurn(path: string) {
    const mChurn: ModuleChurn = {
        path,
        cloc: 0,
        numFiles: 0,
        linesAddDel: 0,
        linesAdded: 0,
        linesDeleted: 0,
        created: undefined,
    };
    return mChurn;
}
