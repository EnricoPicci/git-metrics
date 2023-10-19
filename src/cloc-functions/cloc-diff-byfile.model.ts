import path from "path";

/**
 * Represents the cloc diff for a single file between two Git commits.
 * The type includes the file path, language, and the number of blank lines, comment lines, and code lines 
 * that were added, removed, or modified between the two commits.
 * The type also includes a boolean indicating whether the file is a possible cut-and-paste candidate.
 */
export type ClocDiffByfile = {
    file: string;
    extension: string;
    blank_same: number;
    blank_modified: number;
    blank_added: number;
    blank_removed: number;
    comment_same: number;
    comment_modified: number;
    comment_added: number;
    comment_removed: number;
    code_same: number;
    code_modified: number;
    code_added: number;
    code_removed: number;
    possibleCutPaste: boolean;
};

export function newClocDiffByfile(csvLine: string) {
    const fields = csvLine.split(',');
    const file = fields[0];
    let extension = path.extname(file)
    extension = extension.replace('.', '')
    const blank_same = fields[1] ? parseInt(fields[1]) : 0;
    const blank_modified = fields[1] ? parseInt(fields[2]) : 0;
    const blank_added = fields[1] ? parseInt(fields[3]) : 0;
    const blank_removed = fields[1] ? parseInt(fields[4]) : 0;
    const comment_same = fields[1] ? parseInt(fields[5]) : 0;
    const comment_modified = fields[1] ? parseInt(fields[6]) : 0;
    const comment_added = fields[1] ? parseInt(fields[7]) : 0;
    const comment_removed = fields[1] ? parseInt(fields[8]) : 0;
    const code_same = fields[1] ? parseInt(fields[9]) : 0;
    const code_modified = fields[1] ? parseInt(fields[10]) : 0;
    const code_added = fields[1] ? parseInt(fields[11]) : 0;
    const code_removed = fields[1] ? parseInt(fields[12]) : 0;
    const possibleCutPaste = false;
    const clocDiffByfile: ClocDiffByfile = {
        file,
        extension,
        blank_same,
        blank_modified,
        blank_added,
        blank_removed,
        comment_same,
        comment_modified,
        comment_added,
        comment_removed,
        code_same,
        code_modified,
        code_added,
        code_removed,
        possibleCutPaste,
    };
    return clocDiffByfile
}

// to be used if we want attach the sum of all changes in a commit to the data of related to the diff of one file
// the sum can be used to calculate the percentage of the changes in the file compared to the changes in the commit
// or to filter changes that belong to commits that have a very large number of changes (a large number of changes
// may indicate that the commit is a massive refactoring and therefore soen not represent the typical effort of a dev)
export type ClocDiffByfileWithSum = ClocDiffByfile & { sumOfDiffs?: ClocDiffByfile; };
export function newClocDiffByfileWithSum(csvLine: string) {
    const clocDiffByfile = newClocDiffByfile(csvLine);
    const clocDiffByfileWithSum: ClocDiffByfileWithSum = {
        ...clocDiffByfile,
        sumOfDiffs: undefined,
    };
    return clocDiffByfileWithSum;
}