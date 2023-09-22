import { map, catchError, EMPTY, concatMap, from, filter, toArray } from 'rxjs';
import { executeCommandNewProcessToLinesObs, executeCommandObs } from '../0-tools/execute-command/execute-command';
import { CommitCompact } from './commit.model';

// fetchCommit is a function that fetched all the commits from a git repo and returns the sha of each commit and its date

// #copilot comment - the following comment has been added by copilot

// It uses the git log command to fetch the commits
// It returns an observable of an array of strings
// Each string is a commit sha and date separated by a comma
// The observable is an error if the command fails
export function fetchCommits(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an" --no-merges`;

    return executeCommandNewProcessToLinesObs(
        `Fetch commits`, 'git', ['log', '--pretty=format:%H,%ad,%an', '--no-merges'],
        { cwd: repoPath }
    ).pipe(
        map((commits: string) => commits.split('\n')),
        concatMap((commits: string[]) => {
            return from(commits)
        }),
        map((commit: string) => {
            return newCommitCompactFromGitlog(commit)
        }),
        filter((commit: CommitCompact) => {
            return commit.date >= fromDate && commit.date <= toDate
        }),
        catchError((err: Error) => {
            console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`)
            return EMPTY
        })
    );
}

// It uses the git log command to fetch one commit given its sha
// It returns an observable of an array of strings
// Each string is a commit sha and date separated by a comma
// The observable is an error if the command fails
export function fetchOneCommit(commitSha: string, repoPath: string, verbose = true) {
    if (!commitSha) throw new Error(`Path is mandatory`);
    if (!repoPath) throw new Error(`Repo path is mandatory`);

    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`
    return executeCommandObs(
        'run git-log to find parent', cmd
    ).pipe(
        toArray(),
        map((output) => {
            const commitCompact = newCommitCompactFromGitlog(output[0])
            return commitCompact
        }),
        catchError((error) => {
            const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`
            if (verbose) console.error(err)
            // in case of error we return an error
            throw new Error(err)
        })
    )
}

// newEmptyCommit is a function that returns a new CommitCompact object with no sha neither author and
// the date set to the beginning of the Unix epoch, i.e. 1970-01-01
export function newEmptyCommit() {
    const commit: CommitCompact = {
        sha: '',
        date: new Date(0),
        author: ''
    }
    return commit
}

// newCommitCompactFromGitlog returns a new CommitCompact object with the given sha, author and date
// starting from a string in the format sha,date,author received from the git log command
export function newCommitCompactFromGitlog(commitDataFromGitlog: string) {
    const shaDateAuthor = commitDataFromGitlog.split(',')
    const commit: CommitCompact = {
        sha: shaDateAuthor[0],
        date: new Date(shaDateAuthor[1]),
        author: shaDateAuthor[2]
    }
    return commit
}
