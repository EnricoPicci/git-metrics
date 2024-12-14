import { map } from "rxjs";
import { getRemoteOriginUrl$, gitHttpsUrlFromGitUrl } from "./repo";
import { ExecuteCommandObsOptions } from "../tools/execute-command/execute-command";

/**
 * Returns an Observable that emits the GitLab commit URL for a given Git repository and commit SHA.
 * @param repoPath The path to the Git repository folder.
 * @param commitSha The SHA of the commit.
 * @returns An Observable that emits the GitLab commit URL for the given Git repository and commit SHA.
 */
export function getGitlabCommitUrl$(repoPath: string, commitSha: string, options: ExecuteCommandObsOptions = {}) {
    return getRemoteOriginUrl$(repoPath, options).pipe(
        map((remoteOriginUrl) => {
            return getGitlabCommitUrl(remoteOriginUrl, commitSha)
        }),
    );
}
/**
 * This function generates a GitLab URL for a specific commit.
 * It first converts the remote origin URL to HTTPS format if necessary, then constructs the commit URL using the commit hash.
 *
 * @param remoteOriginUrl - The remote origin URL of the git repository.
 * @param commitSha - The hash of the commit.
 * @returns The GitLab URL for the specified commit.
 */
export function getGitlabCommitUrl(remoteOriginUrl: string, commitSha: string) {
    remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl);
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const commitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${commitSha}`;
    return commitUrl
}

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
export function getGitlabCommitCompareUrl$(repoPath: string, mostRecentSha: string, leastRecentSha: string, options: ExecuteCommandObsOptions = {}) {
    return getRemoteOriginUrl$(repoPath, options).pipe(
        map((remoteOriginUrl) => {
            return getGitlabCommitCompareUrl(remoteOriginUrl, mostRecentSha, leastRecentSha)
        }),
    );
}
/**
 * This function generates a GitLab URL for comparing two commits.
 * It first converts the remote origin URL to HTTPS format if necessary, then constructs the comparison URL using the commit hashes.
 *
 * @param remoteOriginUrl - The remote origin URL of the git repository.
 * @param mostRecentSha - The hash of the most recent commit in the range.
 * @param leastRecentSha - The hash of the least recent commit in the range.
 * @returns The GitLab URL for comparing the specified commits.
 */
export function getGitlabCommitCompareUrl(remoteOriginUrl: string, mostRecentSha: string, leastRecentSha: string) {
    remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl);
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const commitCompareUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/compare/${leastRecentSha}...${mostRecentSha}`;
    return commitCompareUrl
}