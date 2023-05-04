// defines the types used for the various types of data read from git

// Data about a committed file produced with the --numstat option enriched with data coming from the cloc tool
// https://git-scm.com/docs/git-log
export type GitFileNumstatEnriched = {
    linesAdded: number | undefined; // undefined in case of binary files,
    linesDeleted: number | undefined; // undefined in case of binary files
    path: string;
    cloc: number;
    comment: number;
    blank: number;
};

// https://git-scm.com/docs/pretty-formats
export type _CommitDoc = {
    hashShort: string; // abbreviated commit hash
    authorDate: Date; // author date, RFC2822 style
    authorName: string; // author name (respecting .mailmap, see git-shortlog[1] or git-blame[1])
    committerName: string;
    committerDate: Date;
    subject: string;
    parents: string[];
};
export type GitCommitEnriched = _CommitDoc & {
    files: GitFileNumstatEnriched[];
};

export type FileGitCommitEnriched = _CommitDoc & GitFileNumstatEnriched & { created: Date };

export type GitCommitEnrichedWithBranchTips = {
    // branch tips are commits which are not parent of any other commit and therefore represent the tip of a branch
    // stash commits have no children and therefore are considered branch tips
    branchTips: string[];
    // represents a new branch tip which increments the number of branch tips
    isAdditionalBranchTip: boolean;
    // as a commit that represents a merge, i.e. it has more than one parent
    isMerge: boolean;
} & GitCommitEnriched;
