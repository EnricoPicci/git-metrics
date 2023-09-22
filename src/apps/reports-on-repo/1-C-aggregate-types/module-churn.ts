export type ModuleChurn = {
    path: string;
    depth: number; // depth of the module in the folder structure
    cloc: number;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    numChurnedFiles: number; // number of files in a module which have been changed
    cloc_own: number;
    linesAdded_own: number;
    linesDeleted_own: number;
    linesAddDel_own: number;
    created: Date;
};

export function newModuleChurn(path: string) {
    const mChurn: ModuleChurn = {
        path,
        depth: 0,
        cloc: 0,
        numChurnedFiles: 0,
        linesAddDel: 0,
        linesAdded: 0,
        linesDeleted: 0,
        cloc_own: 0,
        linesAdded_own: 0,
        linesDeleted_own: 0,
        linesAddDel_own: 0,
        created: new Date(0),
    };
    mChurn.depth = path.split('/').length - 1;
    return mChurn;
}
