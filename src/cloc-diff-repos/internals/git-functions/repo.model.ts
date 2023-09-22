import { CommitCompact, CommitPair, CommitsByMonths } from "./commit.model";

export interface RepoCompact {
    path: string;
    commits: CommitCompact[];
}

export interface RepoCompactWithCommitPairs {
    path: string;
    commitPairs: CommitPair[];
}

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