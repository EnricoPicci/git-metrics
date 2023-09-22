import { catchError, concatMap, from, map, mergeMap, of, reduce } from "rxjs"
import { runClocDiff } from "../../../cloc-functions/cloc-diff.functions"
import { ClocDiffStats, RepoMonthlyClocDiffStats, noDiffsClocDiffStats } from "../../../cloc-functions/cloc-diff.model"
import { CommitCompact, CommitPair, yearMonthFromDate } from "./commit.model"
import { CommitTuple } from "./repo-cloc-diff.model"
import { CONFIG } from "../../../config"
import { fetchOneCommit, newEmptyCommit } from "./commit.functions"
import { getRemoteOriginUrl, gitHttpsUrlFromGitUrl } from "./repo.functions"

// calculateClocGitDiffs is a function that receives a CommitPair object and calculates the cloc diff between the two commits
// and returns an object with the yearMonth and the cloc diff
export function calculateClocGitDiffs(commitPair: CommitPair, languages: string[]) {
    const firstCommit = commitPair.commitPair[0]
    const secondCommit = commitPair.commitPair[1]
    console.log(`Starting diff for ${commitPair.repoPath} -- Date: ${commitPair.commitPair[1].date.toLocaleDateString()}`)
    return runClocDiff(firstCommit.sha, secondCommit.sha, languages, commitPair.repoPath).pipe(
        map(clocDiff => {
            return {
                repoPath: commitPair.repoPath,
                yearMonth: commitPair.yearMonth,
                leastRecentCommitDate: secondCommit.date.toLocaleDateString(),
                clocDiff
            }
        })
    )
}

// calculateClocGitDiffsChildParent is a function that receives a CommitCompact object and calculates the cloc diff 
// between this commit and its parent
// and returns an object with the yearMonth, the commit date and the cloc diff
export function calculateClocGitDiffsChildParent(commit: CommitCompact, repoPath: string, languages: string[]) {
    const childCommitSha = commit.sha
    const parentCommitSha = `${childCommitSha}^1`
    console.log(`Starting diff for ${repoPath} -- Date: ${commit.date.toLocaleDateString()}`)
    return runClocDiff(childCommitSha, parentCommitSha, languages, repoPath).pipe(
        concatMap(clocDiff => {
            // we read the parent of the child commit so that we can get the date of the parent commit
            return fetchOneCommit(parentCommitSha, repoPath).pipe(
                catchError(() => {
                    // in case of error we return an empty commit
                    return of(newEmptyCommit())
                }),
                map(parentCommit => {
                    return { clocDiff, parentCommit }
                }),
                map(({ clocDiff, parentCommit }) => {
                    const parentCommitDate = parentCommit.date.toLocaleDateString()
                    return {
                        repoPath,
                        yearMonth: yearMonthFromDate(commit.date),
                        mostRecentCommitDate: commit.date.toLocaleDateString(),
                        leastRecentCommitDate: parentCommitDate,
                        clocDiff
                    }
                })
            )
        }),
        concatMap(stat => {
            // we read the remoteOriginUrl of the repo
            return getRemoteOriginUrl(stat.repoPath).pipe(
                map(remoteOriginUrl => {
                    remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl)
                    return { ...stat, remoteOriginUrl }
                })
            )
        })
    )
}

// commitDiffPairs is a function that take a dictionary where the keys are yearMonth and the values are the array of commits
// belonging to that yearMonth and returns a dictionary whose keys are the tearMonth
// and whose values are pairs of commits that are to be used to generate the monthly diff,
// i.e. to calculate the differences that the developers have made in the current month compared to the previous month
//
// Let's consider this example:
// yearMonth            commits
// 2020-03              [commit9, commit8, commit7]        // commits are ordered by date from the most recent to the oldest
// 2020-02              [commit6, commit5, commit4, commit3]
// 2020-01              [commit2, commit1, commit0]
//
// The result of this function will be:
// 2020-03              [commit9, commit6]      
// 2020-02              [commit6, commit3]
// 2020-01              [commit3, commit1]
//
// If a month has no commits then the value for that month will be null and the commit to be used to calculate
// the diff generated in the previous month will be the first commit found going backwards, for instance
// yearMonth            commits
// 2020-03              [commit6, commit5, commit4, commit3] 
// 2020-02              []
// 2020-01              [commit2, commit1]
//
// The result of this function will be:
// 2020-03              [commit6, commit2]
// 2020-02              null
// 2020-01              [commit2, commit1]
//
// If the last month has just one commit then the value for that month will be null, like in this example:
// yearMonth            commits
// 2020-03              [commit6, commit5, commit4, commit3]
// 2020-02              [commit2]
// 2020-01              [commit1]
//
// The result of this function will be:
// 2020-03              [commit6, commit2]
// 2020-02              [commit2, commit1]
// 2020-01              null
//
// #copilot - after having written the comment (where copilot helped in the repeated parts as the description of the examples)
// a good part of the structure of this method has been generated by copilot - the original logic proposed by copilot
// was not correct but it was a good starting point
export function commitDiffPairs(commitsByMonth: { [yearMonth: string]: CommitCompact[] }) {
    const yearMonths = Object.keys(commitsByMonth).sort().reverse()
    const pairs: { [yearMonth: string]: CommitTuple } = {}
    for (let i = 0; i < yearMonths.length - 1; i++) {
        const yearMonth = yearMonths[i]
        const commits = commitsByMonth[yearMonth]
        // sort the commits per date from most recent to least recent
        // #copilot - i was not remeembering how to sort per date but, rather than going to stackoverflow, copilot suggested me
        commits.sort((a, b) => b.date.getTime() - a.date.getTime())
        if (commits.length === 0) {
            pairs[yearMonth] = null
            continue
        }
        const mostRecentCommit = commits[0]
        const leastRecentCommit = findLeastRecentCommit(commitsByMonth, i, yearMonths)
        const newPair: CommitTuple = leastRecentCommit ? [mostRecentCommit, leastRecentCommit] : null
        pairs[yearMonth] = newPair
    }
    // the pair for the oldest month is composed by the most recent and least recent commit of that month
    // if there are at least two commits in that month, otherwise the pair will be null
    const firstYearMonth = yearMonths[yearMonths.length - 1]
    const firstMonthCommits = commitsByMonth[firstYearMonth]
    const pairFirstMonth: CommitTuple = firstMonthCommits.length > 1 ?
        [firstMonthCommits[0], firstMonthCommits[firstMonthCommits.length - 1]] :
        null
    pairs[firstYearMonth] = pairFirstMonth
    return pairs
}
function findLeastRecentCommit(
    commitsByMonth: { [yearMonth: string]: CommitCompact[] },
    i: number,
    yearMonths: string[],
) {
    for (let j = i + 1; j < yearMonths.length; j++) {
        const yearMonth = yearMonths[j]
        const commits = commitsByMonth[yearMonth]
        commits.sort((a, b) => b.date.getTime() - a.date.getTime())
        if (commits.length > 0) {
            return commits[0]
        }
    }
    // returning null means that there are no commits in the previous months
    return null
}

// reposCommitsPairsDiff is a function that receives a dictionary where the keys are the repo names and
// the values are dictionaries where the keys are the yearMonth and the values are the array of commits
// belonging to that yearMonth and returns an array of objects where each object has the following structure:
// {
//     repoName: string,
//     commitPairs: { [yearMonth: string]: CommitPair }
// }
// where the commitPairs are the pairs of commits that are to be used to generate the monthly diff,
// i.e. to calculate the differences that the developers have made in the current month compared to the previous month
//
// #copilot - the entire function has been generated by copilot after I have written the comment above
export function reposCommitsPairsDiff(reposCommits: { [repoPath: string]: { [yearMonth: string]: CommitCompact[] } }) {
    const reposCommitsPairs: { repoPath: string, commitPairs: { [yearMonth: string]: CommitTuple } }[] = []
    for (const repoPath of Object.keys(reposCommits)) {
        const commitsByMonth = reposCommits[repoPath]
        const commitPairs = commitDiffPairs(commitsByMonth)
        reposCommitsPairs.push({ repoPath, commitPairs })
    }
    return reposCommitsPairs
}

// calculateMonthlyClocGitDiffs is a function that receives an object with the path to a repo and an array of commit pairs
// and an array of languagues we are interested in
// and returns an object with the repoPath and a dictionary where the keys are the yearMonth and the values 
// are the cloc diff between the two commits
export function calculateMonthlyClocGitDiffs(
    repoMonthlyCommitPairs: {
        repoPath: string;
        commitPairs: {
            [yearMonth: string]: CommitTuple;
        };
    },
    languages: string[]) {
    const repoPath = repoMonthlyCommitPairs.repoPath
    return from(Object.entries(repoMonthlyCommitPairs.commitPairs)).pipe(
        mergeMap(([yearMonth, commitPair]: [string, CommitTuple]) => {
            console.log(`Starting diff for ${yearMonth}-${repoPath}`)
            const diffObs = commitPair ?
                // the first commit is the most recent one
                runClocDiff(commitPair[0].sha, commitPair[1].sha, languages, repoPath) :
                of(noDiffsClocDiffStats(languages))
            return diffObs.pipe(
                map(clocDiff => {
                    console.log(`Completed diff for ${yearMonth}-${repoPath}`)
                    return { yearMonth, clocDiff }
                }
                ))
        }, CONFIG.CONCURRENCY),
        reduce((acc, { yearMonth, clocDiff }) => {
            acc[yearMonth] = clocDiff
            return acc
        }, {} as { [yearMonth: string]: ClocDiffStats }),
        map(clocDiffStats => {
            const repoClocDiffStats: RepoMonthlyClocDiffStats = { repoPath, clocDiffStats }
            return repoClocDiffStats
        })
    )
}