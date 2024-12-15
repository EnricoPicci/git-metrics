"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitlabCommitCompareUrl = exports.getGitlabCommitCompareUrl$ = exports.getGitlabCommitUrl = exports.getGitlabCommitUrl$ = void 0;
const rxjs_1 = require("rxjs");
const repo_1 = require("./repo");
/**
 * Returns an Observable that emits the GitLab commit URL for a given Git repository and commit SHA.
 * @param repoPath The path to the Git repository folder.
 * @param commitSha The SHA of the commit.
 * @returns An Observable that emits the GitLab commit URL for the given Git repository and commit SHA.
 */
function getGitlabCommitUrl$(repoPath, commitSha, options = {}) {
    return (0, repo_1.getRemoteOriginUrl$)(repoPath, options).pipe((0, rxjs_1.map)((remoteOriginUrl) => {
        return getGitlabCommitUrl(remoteOriginUrl, commitSha);
    }));
}
exports.getGitlabCommitUrl$ = getGitlabCommitUrl$;
/**
 * This function generates a GitLab URL for a specific commit.
 * It first converts the remote origin URL to HTTPS format if necessary, then constructs the commit URL using the commit hash.
 *
 * @param remoteOriginUrl - The remote origin URL of the git repository.
 * @param commitSha - The hash of the commit.
 * @returns The GitLab URL for the specified commit.
 */
function getGitlabCommitUrl(remoteOriginUrl, commitSha) {
    remoteOriginUrl = (0, repo_1.gitHttpsUrlFromGitUrl)(remoteOriginUrl);
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const commitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${commitSha}`;
    return commitUrl;
}
exports.getGitlabCommitUrl = getGitlabCommitUrl;
/**
 * This function generates a GitLab URL for comparing two commits.
 * It first retrieves the remote origin URL of the Git repository, then constructs the comparison URL using the commit hashes.
 *
 * @param repoPath - The path to the git repository.
 * @param mostRecentSha - The hash of the most recent commit in the range.
 * @param leastRecentSha - The hash of the least recent commit in the range.
 * @param options - Optional parameters for the getRemoteOriginUrl$ function.
 * @returns An Observable that emits the GitLab comparison URL.
 */
function getGitlabCommitCompareUrl$(repoPath, mostRecentSha, leastRecentSha, options = {}) {
    return (0, repo_1.getRemoteOriginUrl$)(repoPath, options).pipe((0, rxjs_1.map)((remoteOriginUrl) => {
        return getGitlabCommitCompareUrl(remoteOriginUrl, mostRecentSha, leastRecentSha);
    }));
}
exports.getGitlabCommitCompareUrl$ = getGitlabCommitCompareUrl$;
/**
 * This function generates a GitLab URL for comparing two commits.
 * It first converts the remote origin URL to HTTPS format if necessary, then constructs the comparison URL using the commit hashes.
 *
 * @param remoteOriginUrl - The remote origin URL of the git repository.
 * @param mostRecentSha - The hash of the most recent commit in the range.
 * @param leastRecentSha - The hash of the least recent commit in the range.
 * @returns The GitLab URL for comparing the specified commits.
 */
function getGitlabCommitCompareUrl(remoteOriginUrl, mostRecentSha, leastRecentSha) {
    remoteOriginUrl = (0, repo_1.gitHttpsUrlFromGitUrl)(remoteOriginUrl);
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const commitCompareUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/compare/${leastRecentSha}...${mostRecentSha}`;
    return commitCompareUrl;
}
exports.getGitlabCommitCompareUrl = getGitlabCommitCompareUrl;
//# sourceMappingURL=commit-url.js.map