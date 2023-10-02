import { Commit, GitFileNumstat } from "../git-functions/commit.model"

/**
 * Represents a file in a Git repository with its number of lines added and removed, 
 * enriched with the data retrieved using cloc (i.e. num of lines of code, comments and blanks).
 * This type extends the `GitFileNumstat` type and adds `code`, `comment`, and `blank` properties, 
 * which represent the number of lines of code, comments, and blanks in the file, respectively.
 */
export type GitFileNumstatEnrichedWithCloc = GitFileNumstat & {
    code: number;
    comment: number;
    blank: number
}

/**
 * Represents a commit with its files, each file enriched with the data retrieved using cloc 
 * (i.e. num of lines of code, comments and blanks).
 * This type extends the `Commit` type and adds a `files` property, which is an array of `GitFileNumstatEnrichedWithCloc` objects.
 */
export type CommitWithFileNumstatsEnrichedWithCloc = Commit & { files: GitFileNumstatEnrichedWithCloc[]; }
