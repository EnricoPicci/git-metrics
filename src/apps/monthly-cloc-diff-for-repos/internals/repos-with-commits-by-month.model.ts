import { CommitCompact } from "../../../git-functions/commit.model";
import { RepoCompact } from "../../../git-functions/repo.model";

import { CommitsByMonths } from "./commits-by-month.functions";

export interface RepoCompactWithCommitsByMonths extends RepoCompact {
    commitsByMonth: CommitsByMonths;
}

export interface ReposWithCommitsByMonths {
    [yearMonth: string]: {
        repoPath: string,
        commits: CommitCompact[],
        authors: string[]
    }[]
}