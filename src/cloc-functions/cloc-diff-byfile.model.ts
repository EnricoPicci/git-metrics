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
    };
    return clocDiffByfile
}

/**
 * Represents the same type as ClocDiffByfile, but it also includes a `sumOfDiffs` property where we can store the sum of all diffs.
 * To be used if we want attach the sum of all changes in a commit to the data of related to the diff of one file.
 * The sum can be used to calculate the percentage of the changes in the file compared to the changes in the commit
 * or to filter changes that belong to commits that have a very large number of changes (a large number of changes
 * may indicate that the commit is a massive refactoring and therefore does not represent the typical effort of a dev).
 */
export type ClocDiffByfileWithSum = ClocDiffByfile & { sumOfDiffs?: ClocDiffByfile; };
export function newClocDiffByfileWithSum(csvLine: string) {
    const clocDiffByfile = newClocDiffByfile(csvLine);
    const clocDiffByfileWithSum: ClocDiffByfileWithSum = {
        ...clocDiffByfile,
        sumOfDiffs: undefined,
    };
    return clocDiffByfileWithSum;
}

/**
 * Represents the same type as ClocDiffByfile, but it also includes the number of lines of code added, removed, modified, and unchanged 
 * in the commit.
 * The info about the changes at commit level may be used to evaluate if the change belongs to a massive refactoring.
 * For isntance, it is reasonable to think that a single commit that has a large number of changes is a massive refactoring.
 */
export type ClocDiffByfileWithCommitData = ClocDiffByfile & {
    commit_code_added: number;
    commit_code_removed: number;
    commit_code_modified: number;
    commit_code_same: number;
};
export function newClocDiffByfileWithCommitData(diffRec: ClocDiffByfileWithSum) {
    if (!diffRec.sumOfDiffs) {
        throw new Error('The sum of the diffs must be calculated before calculating the commit diffs');
    }
    const clocDiffByfileWithCommitDiffs: ClocDiffByfileWithCommitData = {
        ...diffRec,
        commit_code_added: diffRec.sumOfDiffs.code_added,
        commit_code_removed: diffRec.sumOfDiffs.code_removed,
        commit_code_modified: diffRec.sumOfDiffs.code_modified,
        commit_code_same: diffRec.sumOfDiffs.code_same,
    };
    return clocDiffByfileWithCommitDiffs;
}
