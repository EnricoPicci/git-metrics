"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteOriginUrl$ = exports.gitHttpsUrlFromGitUrl = exports.repoCompact$ = exports.reposCompactInFolder$ = exports.cloneRepo$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const commit_1 = require("./commit");
const repo_path_functions_1 = require("./repo-path.functions");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
/**
 * Clones a Git repository from a given URL to a given path and returns the path of the cloned repository.
 * @param url The URL of the Git repository to clone.
 * @param repoPath The path where the repository should be cloned.
 * @returns An Observable that emits the path of the cloned repository.
 * @throws An error if the URL or repoPath parameters are not provided.
 */
function cloneRepo$(url, repoPath) {
    if (!url)
        throw new Error(`url is mandatory`);
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const repoName = path_1.default.basename(repoPath);
    const command = `git clone ${url} ${repoPath.replaceAll(' ', '_')}`;
    return (0, execute_command_1.executeCommandObs)(`Clone ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} cloned`), (0, rxjs_1.map)(() => repoPath), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`);
        console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
        return rxjs_1.EMPTY;
    }));
}
exports.cloneRepo$ = cloneRepo$;
/**
 * Returns an Observable that notifies the list of RepoCompact objects representing all the repos in a given folder.
 * Repos whose name is in the excludeRepoPaths array are excluded. Wildcards can be used,
 * e.g. ['repo1', 'repo2', 'repo3*'] will exclude repo1, repo2 and all the repos that start with repo3.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param concurrency The maximum number of concurrent requests. Defaults to 1.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that notifies the list of RepoCompact objects representing all the repos in the given folder.
 */
function reposCompactInFolder$(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1, excludeRepoPaths = []) {
    const repoPaths = (0, repo_path_functions_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)((repoPaths) => {
        console.log(`Repos to be analyzed: ${repoPaths.length}`);
        repoPaths.forEach((repoPath) => {
            console.log(`Repo to be analyzed: ${repoPath}`);
        });
    }), (0, rxjs_1.concatMap)((repoPaths) => {
        return (0, rxjs_1.from)(repoPaths);
    }), (0, rxjs_1.mergeMap)((repoPath) => {
        return repoCompact$(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactInFolder$ = reposCompactInFolder$;
/**
 * Returns an Observable that notifies a new RepoCompact filled with its commits sorted by date ascending.
 * @param repoPath The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @returns An Observable that notifies a new RepoCompact filled with its commits sorted by date ascending.
 */
function repoCompact$(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return (0, commit_1.readCommitCompact$)(repoPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((commits) => {
        const repo = { path: repoPath, commits };
        return repo;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.EMPTY;
    }));
}
exports.repoCompact$ = repoCompact$;
/**
 * Returns the https url of a Git repository given its ssh url.
 * If the input is already an https url, the same url is returned.
 * For instance, the following ssh url:
 * git@git.ad.rgigroup.com:vita/dbobjects-passvita.git
 * becomes:
 * https://git.ad.rgigroup.com/vita/dbobjects-passvita.git
 * @param gitUrl The ssh url of the Git repository.
 * @returns The https url of the Git repository.
 * @throws An error if the gitUrl parameter is not provided or does not start with "git@".
 */
function gitHttpsUrlFromGitUrl(gitUrl) {
    if (gitUrl.startsWith('https://'))
        return gitUrl;
    if (!gitUrl.startsWith('git@'))
        throw new Error(`gitUrl must start with "git@"`);
    const gitSshParts = gitUrl.split('@');
    const gitSshUrlWithoutInitialGit = gitSshParts[1];
    const gitSshUrlWithoutGitExtension = gitSshUrlWithoutInitialGit.replace(':', '/');
    const gitHttpsUrl = `https://${gitSshUrlWithoutGitExtension}`;
    return gitHttpsUrl;
}
exports.gitHttpsUrlFromGitUrl = gitHttpsUrlFromGitUrl;
/**
 * Returns an Observable that emits the remote origin url of a Git repository.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the remote origin url of the Git repository.
 */
function getRemoteOriginUrl$(repoPath) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return (0, execute_command_1.executeCommandObs)('run git  config --get remote.origin.url', cmd).pipe((0, rxjs_1.map)((output) => {
        return output.split('\n')[0];
    }));
}
exports.getRemoteOriginUrl$ = getRemoteOriginUrl$;
//# sourceMappingURL=repo.js.map