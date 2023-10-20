import { map } from "rxjs";
import { getRemoteOriginUrl$, gitHttpsUrlFromGitUrl } from "./repo";

/**
 * Returns an Observable that emits the GitLab commit URL for a given Git repository and commit SHA.
 * @param repoPath The path to the Git repository folder.
 * @param commitSha The SHA of the commit.
 * @returns An Observable that emits the GitLab commit URL for the given Git repository and commit SHA.
 */
export function getGitlabCommitUrl(repoPath: string, commitSha: string) {
    return getRemoteOriginUrl$(repoPath).pipe(
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