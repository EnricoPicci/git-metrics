"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteOriginUrl$ = exports.gitHttpsUrlFromGitUrl = exports.repoCompact$ = exports.reposCompactInFolder$ = exports.checkoutAllReposAtDate$ = exports.checkoutRepoAtCommit$ = exports.checkoutRepoAtDate$ = exports.fetchAllRepos$ = exports.fetchRepo$ = exports.pullAllRepos$ = exports.pullRepo$ = exports.cloneRepo$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const commit_1 = require("./commit");
const repo_path_1 = require("./repo-path");
const git_errors_1 = require("./git-errors");
const branches_1 = require("./branches");
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
    return (0, execute_command_1.executeCommandObs)(`Clone ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} cloned`), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(repoPath), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`);
        console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
        return rxjs_1.EMPTY;
    }));
}
exports.cloneRepo$ = cloneRepo$;
/**
 * Pulls a Git repository from a given path and returns an Observable that emits the path of the pulled repository
 * once the pull is completed.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the path of the pulled repository once the pull is completed.
 * @throws An error if the repoPath parameter is not provided.
 */
function pullRepo$(repoPath) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const repoName = path_1.default.basename(repoPath);
    let command;
    command = `cd ${repoPath} && git pull`;
    return (0, execute_command_1.executeCommandObs)(`Pull ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} pulled`), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(repoPath), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while pulling repo "${repoName}" - error code: ${err.code}`);
        console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
        console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
        const _error = new git_errors_1.PullError(err, repoPath, command);
        return (0, rxjs_1.of)(_error);
    }));
}
exports.pullRepo$ = pullRepo$;
/**
 * Pulls all the Git repositories in a given folder and returns an Observable that emits the paths of the pulled repositories.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param concurrency The maximum number of concurrent requests. Defaults to 1.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits the paths of the pulled repositories.
 */
function pullAllRepos$(folderPath, concurrency = 1, excludeRepoPaths = []) {
    const repoPaths = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    console.log(`Repos to be pulled: ${repoPaths.length}`);
    let counter = 0;
    const reposErroring = [];
    repoPaths.forEach((repoPath) => {
        console.log(`Repo to be pulled: ${repoPath}`);
    });
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return pullRepo$(repoPath);
    }, concurrency), (0, rxjs_1.tap)({
        next: (val) => {
            if (val instanceof git_errors_1.PullError) {
                reposErroring.push(val.repoPath);
            }
            console.log(`Pulled ${++counter} repos of ${repoPaths.length} (erroring: ${reposErroring.length})`);
        },
        complete: () => {
            console.log(`\nPulled ${counter} repos of ${repoPaths.length}`);
            console.log(`\nErrored repos: ${reposErroring.length}`);
            reposErroring.forEach((repoPath) => {
                console.log(`- ${repoPath} errored`);
            });
        }
    }));
}
exports.pullAllRepos$ = pullAllRepos$;
/**
 * Fetches a Git repository from a given path and returns an Observable that emits the path of the fetched repository
 * once the fetch is completed.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the path of the fetched repository once the fetch is completed.
 * @throws An error if the repoPath parameter is not provided.
 */
function fetchRepo$(repoPath) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const repoName = path_1.default.basename(repoPath);
    const command = `cd ${repoPath} && git fetch --all`;
    return (0, execute_command_1.executeCommandObs)(`Fetch ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} fetched`), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(repoPath), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while fetching repo "${repoName}" - error code: ${err.code}`);
        console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
        console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
        const _error = new git_errors_1.FetchError(err, repoPath, command);
        return (0, rxjs_1.of)(_error);
    }));
}
exports.fetchRepo$ = fetchRepo$;
/**
 * Fetches all the Git repositories in a given folder and returns an Observable that emits the paths of the fetched repositories.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param concurrency The maximum number of concurrent requests. Defaults to 1.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits the paths of the fetched repositories.
 */
function fetchAllRepos$(folderPath, concurrency = 1, excludeRepoPaths = []) {
    const repoPaths = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    console.log(`Repos to be fetched: ${repoPaths.length}`);
    let counter = 0;
    const reposErroring = [];
    repoPaths.forEach((repoPath) => {
        console.log(`Repo to be fetched: ${repoPath}`);
    });
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return fetchRepo$(repoPath);
    }, concurrency), (0, rxjs_1.tap)({
        next: (val) => {
            if (val instanceof git_errors_1.FetchError) {
                reposErroring.push(val.repoPath);
            }
            console.log(`Fetched ${++counter} repos of ${repoPaths.length} (erroring: ${reposErroring.length})`);
        },
        complete: () => {
            console.log(`\nFetched ${counter} repos of ${repoPaths.length}`);
            console.log(`\nNumber of erroring repos: ${reposErroring.length}`);
            console.log(`Erroring repos:`);
            reposErroring.forEach((repoPath) => {
                console.log(`- ${repoPath} errored`);
            });
        }
    }));
}
exports.fetchAllRepos$ = fetchAllRepos$;
/**
 * Checks out a Git repository at a commit at the date passed in as parameter or, in case there is no commit at that date,
 * takes the commit before that date. Returns an Observable that emits the path to the repository
 * or a CheckoutError if an error occurs during the checkout process.
 * @param repoPath The path to the Git repository and the sha of the commit used to check out.
 * @param date The date to check out the repository at.
 * @returns An Observable that emits the path to the repository or a CheckoutError if an error occurs during the checkout process.
 */
function checkoutRepoAtDate$(repoPath, date, options) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    return (0, branches_1.defaultBranchName$)(repoPath, options).pipe((0, rxjs_1.concatMap)(branch => (0, commit_1.commitAtDateOrBefore$)(repoPath, date, branch, options)), (0, rxjs_1.concatMap)(([sha, commitDate]) => {
        if (!sha) {
            console.error(`!!!!!!!!!!!!!!! Error: while checking out repo "${repoPath}" `);
            console.error(`!!!!!!!!!!!!!!! No commit found at date: ${date}`);
            const _error = new git_errors_1.CheckoutError(`No commit found at date: ${date}`, repoPath, `git checkout`, sha);
            throw _error;
        }
        return (0, commit_1.checkout$)(repoPath, sha, options).pipe((0, rxjs_1.map)(() => {
            return { repoPath, sha, commitDate };
        }), (0, rxjs_1.catchError)((err) => {
            if (err instanceof git_errors_1.GitError) {
                console.error(`!!!!!!!!!!!!!!! Error: while checking out repo "${repoPath}" `);
                console.error(err.message);
                const _error = new git_errors_1.CheckoutError(err.message, repoPath, err.command, sha);
                throw _error;
            }
            throw err;
        }));
    }), (0, rxjs_1.last)(), (0, rxjs_1.map)(({ repoPath, sha, commitDate }) => {
        return { repoPath, sha, commitDate };
    }));
}
exports.checkoutRepoAtDate$ = checkoutRepoAtDate$;
function checkoutRepoAtCommit$(repoPath, sha, options) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    return (0, commit_1.checkout$)(repoPath, sha, options).pipe((0, rxjs_1.catchError)((err) => {
        if (err instanceof git_errors_1.GitError) {
            console.error(`!!!!!!!!!!!!!!! Error: while checking out repo "${repoPath}" `);
            console.error(err.message);
            const _error = new git_errors_1.CheckoutError(err.message, repoPath, err.command, sha);
            throw _error;
        }
        throw err;
    }));
}
exports.checkoutRepoAtCommit$ = checkoutRepoAtCommit$;
/**
 * Checks out all repositories in a folder at a specific date and returns an Observable that emits the path to each repository.
 * If an error occurs during the checkout process, the Observable emits a CheckoutError object.
 * @param folderPath The path to the folder containing the repositories.
 * @param date The date to check out the repositories at.
 * @param concurrency The maximum number of concurrent checkouts. Defaults to 1.
 * @param excludeRepoPaths An array of repository paths to exclude from the checkout. Defaults to an empty array.
 * @returns An Observable that emits the path to each repository as it is checked out.
 * @throws A CheckoutError if an error occurs during the checkout process.
 */
function checkoutAllReposAtDate$(folderPath, date, options) {
    const { concurrency, excludeRepoPaths, } = options;
    options.concurrency = options.concurrency || 1;
    const checkedOutRepos = [];
    const erroredRepos = [];
    const repoPaths = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
    console.log(`Number of repos to be checkedout: ${repoPaths.length}`);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return checkoutRepoAtDate$(repoPath, date, options).pipe((0, rxjs_1.catchError)((err) => {
            if (err instanceof git_errors_1.CheckoutError) {
                erroredRepos.push({ repo: err.repoPath, sha: err.sha, command: err.command, message: err.message });
                return rxjs_1.EMPTY;
            }
            throw err;
        }));
    }, concurrency), (0, rxjs_1.tap)({
        next: (val) => {
            checkedOutRepos.push({ repo: val.repoPath, sha: val.sha, command: `checkout ${val.sha}` });
        },
    }), (0, rxjs_1.last)(), (0, rxjs_1.map)(() => {
        console.log(`Checked out ${repoPaths.length - erroredRepos.length} repos of ${repoPaths.length}`);
        console.log(`Errored repos: ${erroredRepos.length}`);
        return { checkedOutRepos, erroredRepos };
    }));
}
exports.checkoutAllReposAtDate$ = checkoutAllReposAtDate$;
/**
 * Returns an Observable that notifies the list of RepoCompact objects representing all the repos in a given folder.
 * Only commits between the fromDate and toDate parameters are included in the RepoCompact objects.
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
    const repoPaths = (0, repo_path_1.gitRepoPaths)(folderPath, excludeRepoPaths);
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
 * Only commits between the fromDate and toDate parameters are included.
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
function getRemoteOriginUrl$(repoPath, options) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return (0, execute_command_1.executeCommandObs)('run git  config --get remote.origin.url', cmd, options).pipe((0, rxjs_1.map)((output) => {
        return output.split('\n')[0];
    }));
}
exports.getRemoteOriginUrl$ = getRemoteOriginUrl$;
//# sourceMappingURL=repo.js.map