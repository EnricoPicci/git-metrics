"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCommitCompactFromGitlog = exports.newEmptyCommit = exports.fetchOneCommit = exports.fetchCommits = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../0-tools/execute-command/execute-command");
// fetchCommit is a function that fetched all the commits from a git repo and returns the sha of each commit and its date
// #copilot comment - the following comment has been added by copilot
// It uses the git log command to fetch the commits
// It returns an observable of an array of strings
// Each string is a commit sha and date separated by a comma
// The observable is an error if the command fails
function fetchCommits(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an" --no-merges`;
    return (0, execute_command_1.executeCommandNewProcessToLinesObs)(`Fetch commits`, 'git', ['log', '--pretty=format:%H,%ad,%an', '--no-merges'], { cwd: repoPath }).pipe((0, rxjs_1.map)((commits) => commits.split('\n')), (0, rxjs_1.concatMap)((commits) => {
        return (0, rxjs_1.from)(commits);
    }), (0, rxjs_1.map)((commit) => {
        return newCommitCompactFromGitlog(commit);
    }), (0, rxjs_1.filter)((commit) => {
        return commit.date >= fromDate && commit.date <= toDate;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`);
        return rxjs_1.EMPTY;
    }));
}
exports.fetchCommits = fetchCommits;
// It uses the git log command to fetch one commit given its sha
// It returns an observable of an array of strings
// Each string is a commit sha and date separated by a comma
// The observable is an error if the command fails
function fetchOneCommit(commitSha, repoPath, verbose = true) {
    if (!commitSha)
        throw new Error(`Path is mandatory`);
    if (!repoPath)
        throw new Error(`Repo path is mandatory`);
    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return (0, execute_command_1.executeCommandObs)('run git-log to find parent', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((output) => {
        const commitCompact = newCommitCompactFromGitlog(output[0]);
        return commitCompact;
    }), (0, rxjs_1.catchError)((error) => {
        const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`;
        if (verbose)
            console.error(err);
        // in case of error we return an error
        throw new Error(err);
    }));
}
exports.fetchOneCommit = fetchOneCommit;
// newEmptyCommit is a function that returns a new CommitCompact object with no sha neither author and
// the date set to the beginning of the Unix epoch, i.e. 1970-01-01
function newEmptyCommit() {
    const commit = {
        sha: '',
        date: new Date(0),
        author: ''
    };
    return commit;
}
exports.newEmptyCommit = newEmptyCommit;
// newCommitCompactFromGitlog returns a new CommitCompact object with the given sha, author and date
// starting from a string in the format sha,date,author received from the git log command
function newCommitCompactFromGitlog(commitDataFromGitlog) {
    const shaDateAuthor = commitDataFromGitlog.split(',');
    const commit = {
        sha: shaDateAuthor[0],
        date: new Date(shaDateAuthor[1]),
        author: shaDateAuthor[2]
    };
    return commit;
}
exports.newCommitCompactFromGitlog = newCommitCompactFromGitlog;
//# sourceMappingURL=commit.functions.js.map