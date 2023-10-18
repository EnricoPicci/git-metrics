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
    const blank_same = parseInt(fields[1]);
    const blank_modified = parseInt(fields[2]);
    const blank_added = parseInt(fields[3]);
    const blank_removed = parseInt(fields[4]);
    const comment_same = parseInt(fields[5]);
    const comment_modified = parseInt(fields[6]);

    const comment_added = parseInt(fields[7]);
    const comment_removed = parseInt(fields[8]);
    const code_same = parseInt(fields[9]);
    const code_modified = parseInt(fields[10]);
    const code_added = parseInt(fields[11]);
    const code_removed = parseInt(fields[12]);
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
