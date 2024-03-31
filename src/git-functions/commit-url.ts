import { map } from "rxjs";
import { getRemoteOriginUrl$, gitHttpsUrlFromGitUrl } from "./repo";
import { ExecuteCommandObsOptions } from "../tools/execute-command/execute-command";

/**
 * Returns an Observable that emits the GitLab commit URL for a given Git repository and commit SHA.
 * @param repoPath The path to the Git repository folder.
 * @param commitSha The SHA of the commit.
 * @returns An Observable that emits the GitLab commit URL for the given Git repository and commit SHA.
 */
export function getGitlabCommitUrl(repoPath: string, commitSha: string, options?: ExecuteCommandObsOptions) {
    return getRemoteOriginUrl$(repoPath, options).pipe(
        map((remoteOriginUrl) => {
            remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl);
            const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
                ? remoteOriginUrl.slice(0, -4)
                : remoteOriginUrl;
            const commitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${commitSha}`;
            return commitUrl
        }),
    );
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
export function getGitlabCommitCompareUrl(repoPath: string, mostRecentSha: string, leastRecentSha: string, options?: ExecuteCommandObsOptions) {
    return getRemoteOriginUrl$(repoPath, options).pipe(
        map((remoteOriginUrl) => {
            remoteOriginUrl = gitHttpsUrlFromGitUrl(remoteOriginUrl);
            const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
                ? remoteOriginUrl.slice(0, -4)
                : remoteOriginUrl;
            const commitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/compare/${leastRecentSha}...${mostRecentSha}`;
            return commitUrl
        }),
    );
}