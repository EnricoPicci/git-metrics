export interface CommitCompact {
    sha: string;
    date: Date;
    author: string
}

export interface CommitPair {
    repoPath: string,
    yearMonth: string,
    mostRecentCommitDate: string,
    commitPair: [CommitCompact, CommitCompact]
}