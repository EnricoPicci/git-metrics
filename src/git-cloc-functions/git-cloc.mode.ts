import { Commit, GitFileNumstat } from "../git-functions/commit.model"

export type GitFileNumstatEnrichedWithCloc = GitFileNumstat & {
    code: number;
    comment: number;
    blank: number
}

// CommitWithFileNumstatsEnrichedWithCloc represents a commit with its files, each file enriched with the data
// retrieved using cloc (i.e. num of lines of code, comments and blanks)
export type CommitWithFileNumstatsEnrichedWithCloc = Commit & { files: GitFileNumstatEnrichedWithCloc[]; }
