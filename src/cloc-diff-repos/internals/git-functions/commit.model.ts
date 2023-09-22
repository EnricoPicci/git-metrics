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

export function newCommitPair(repoPath: string, leastRecentCommit: CommitCompact, mostRecentCommit: CommitCompact) {
    const commitPairObj: CommitPair = {
        repoPath,
        yearMonth: yearMonthFromDate(mostRecentCommit.date),
        mostRecentCommitDate: mostRecentCommit.date.toLocaleString(),
        commitPair: [leastRecentCommit, mostRecentCommit]
    }
    return commitPairObj
}

export function yearMonthFromDate(date: Date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2)
    const year = date.getFullYear()
    return `${year}-${month}`
}

export interface CommitsByMonths {
    [yearMonth: string]: {
        commits: CommitCompact[],
        authors: Set<string>
    }
}
