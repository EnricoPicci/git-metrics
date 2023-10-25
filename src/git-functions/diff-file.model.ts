/**
 * Represents a file that has been changed in a Git diff.
 * Contains information about the number of lines added and deleted, 
 * the file path, the path of the file before a rename or copy operation, 
 * and whether the file has been renamed or copied.
 */
export type GitDiffFile = {
    linesAdded: number,
    linesDeleted: number,
    filePath: string,
    preImagePath: string,
    isRenameCopy: boolean,
}

export type GitDiffFileDict = {
    [filePath: string]: GitDiffFile;
}