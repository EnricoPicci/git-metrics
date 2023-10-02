// defines the types used for the various types of data read from git

import { GitFileNumstatEnrichedWithCloc } from "../../../git-cloc-functions/git-cloc.mode";
import { CommitWithFileNumstats } from "../../../git-functions/commit.model";

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
export type FileGitCommitEnriched = _CommitDoc & GitFileNumstatEnrichedWithCloc & { created: Date };

export type GitCommitEnrichedWithBranchTips = {
    // branch tips are commits which are not parent of any other commit and therefore represent the tip of a branch
    // stash commits have no children and therefore are considered branch tips
    branchTips: string[];
    // represents a new branch tip which increments the number of branch tips
    isAdditionalBranchTip: boolean;
    // as a commit that represents a merge, i.e. it has more than one parent
    isMerge: boolean;
} & CommitWithFileNumstats;
