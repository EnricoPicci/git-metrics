"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitlabCommitUrl = void 0;
const rxjs_1 = require("rxjs");
const repo_1 = require("./repo");
/**
 * Returns an Observable that emits the GitLab commit URL for a given Git repository and commit SHA.
 * @param repoPath The path to the Git repository folder.
 * @param commitSha The SHA of the commit.
 * @returns An Observable that emits the GitLab commit URL for the given Git repository and commit SHA.
 */
function getGitlabCommitUrl(repoPath, commitSha, options) {
    return (0, repo_1.getRemoteOriginUrl$)(repoPath, options).pipe((0, rxjs_1.map)((remoteOriginUrl) => {
        remoteOriginUrl = (0, repo_1.gitHttpsUrlFromGitUrl)(remoteOriginUrl);
        const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
            ? remoteOriginUrl.slice(0, -4)
            : remoteOriginUrl;
        const commitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${commitSha}`;
        return commitUrl;
    }));
}
exports.getGitlabCommitUrl = getGitlabCommitUrl;
//# sourceMappingURL=commit-url.js.map