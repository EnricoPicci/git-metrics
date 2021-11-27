export type FileChurn = {
    path: string;
    cloc: number;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    commits: number;
    created: Date;
};
