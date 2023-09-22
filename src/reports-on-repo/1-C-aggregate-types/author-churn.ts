export type AuthorChurn = {
    authorName: string;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    commits: number;
    firstCommit: Date;
    lastCommit: Date;
};
