import path from 'path';

import { tap, map, catchError, EMPTY, concatMap, from, mergeMap, toArray, ignoreElements, defaultIfEmpty, of, last, } from 'rxjs';

import { CmdErrored, CmdExecuted, ExecuteCommandObsOptions, executeCommandObs } from '../tools/execute-command/execute-command';

import { RepoCompact } from './repo.model';
import { checkout$, commitAtDateOrBefore$, readCommitCompact$ } from './commit';
import { gitRepoPaths } from './repo-path';
import { CheckoutError, FetchError, GitError, PullError } from './git-errors';
import { defaultBranchName$ } from './branches';

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
export function cloneRepo$(url: string, repoPath: string) {
    if (!url) throw new Error(`url is mandatory`);
    if (!repoPath) throw new Error(`Path is mandatory`);

    const repoName = path.basename(repoPath);
    const command = `git clone ${url} ${repoPath.replaceAll(' ', '_')}`;

    return executeCommandObs(`Clone ${repoName}`, command).pipe(
        tap(() => `${repoName} cloned`),
        ignoreElements(),
        defaultIfEmpty(repoPath),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`);
            console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
            return EMPTY;
        }),
    );
}

/**
 * Pulls a Git repository from a given path and returns an Observable that emits the path of the pulled repository
 * once the pull is completed.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the path of the pulled repository once the pull is completed.
 * @throws An error if the repoPath parameter is not provided.
 */
export function pullRepo$(repoPath: string) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    const repoName = path.basename(repoPath);
    let command: string

    command = `cd ${repoPath} && git pull`;
    return executeCommandObs(`Pull ${repoName}`, command).pipe(
        tap(() => `${repoName} pulled`),
        ignoreElements(),
        defaultIfEmpty(repoPath),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while pulling repo "${repoName}" - error code: ${err.code}`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
            const _error = new PullError(err, repoPath, command);
            return of(_error);
        }),
    )
}
/**
 * Pulls all the Git repositories in a given folder and returns an Observable that emits the paths of the pulled repositories.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param concurrency The maximum number of concurrent requests. Defaults to 1.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits the paths of the pulled repositories.
 */
export function pullAllRepos$(folderPath: string, concurrency = 1, excludeRepoPaths: string[] = []) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    console.log(`Repos to be pulled: ${repoPaths.length}`);

    let counter = 0;
    const reposErroring: string[] = [];

    repoPaths.forEach((repoPath) => {
        console.log(`Repo to be pulled: ${repoPath}`);
    });
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return pullRepo$(repoPath);
        }, concurrency),
        tap({
            next: (val) => {
                if (val instanceof PullError) {
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
        })
    );
}

/**
 * Fetches a Git repository from a given path and returns an Observable that emits the path of the fetched repository
 * once the fetch is completed.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the path of the fetched repository once the fetch is completed.
 * @throws An error if the repoPath parameter is not provided.
 */
export function fetchRepo$(repoPath: string) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    const repoName = path.basename(repoPath);
    const command = `cd ${repoPath} && git fetch --all`;

    return executeCommandObs(`Fetch ${repoName}`, command).pipe(
        tap(() => `${repoName} fetched`),
        ignoreElements(),
        defaultIfEmpty(repoPath),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while fetching repo "${repoName}" - error code: ${err.code}`);
            console.error(`!!!!!!!!!!!!!!! error message: ${err.message}`);
            console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
            const _error = new FetchError(err, repoPath, command);
            return of(_error);
        }),
    );
}

/**
 * Fetches all the Git repositories in a given folder and returns an Observable that emits the paths of the fetched repositories.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param concurrency The maximum number of concurrent requests. Defaults to 1.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits the paths of the fetched repositories.
 */
export function fetchAllRepos$(folderPath: string, concurrency = 1, excludeRepoPaths: string[] = []) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    console.log(`Repos to be fetched: ${repoPaths.length}`);

    let counter = 0;
    const reposErroring: string[] = [];

    repoPaths.forEach((repoPath) => {
        console.log(`Repo to be fetched: ${repoPath}`);
    });
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return fetchRepo$(repoPath);
        }, concurrency),
        tap({
            next: (val) => {
                if (val instanceof FetchError) {
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
        })
    );
}

/**
 * Checks out a Git repository at a specific date and returns an Observable that emits the path to the repository
 * or a CheckoutError if an error occurs during the checkout process.
 * @param repoPath The path to the Git repository.
 * @param date The date to check out the repository at.
 * @param branch The branch to check out. Defaults to 'master'.
 * @returns An Observable that emits the path to the repository or a CheckoutError if an error occurs during the checkout process.
 */
export function checkoutRepoAtDate$(
    repoPath: string,
    date: Date,
    options: ExecuteCommandObsOptions
) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    let _sha: string = '';
    return defaultBranchName$(repoPath, options).pipe(
        concatMap(branch => commitAtDateOrBefore$(repoPath, date, branch, options)),
        concatMap(([sha]) => {
            _sha = sha;
            return checkout$(repoPath, sha, options)
        }),
        ignoreElements(),
        defaultIfEmpty({ repoPath, sha: _sha }),
        map(() => {
            return { repoPath, sha: _sha };
        }),
        catchError((err) => {
            if (err instanceof GitError) {
                console.error(`!!!!!!!!!!!!!!! Error: while checking out repo "${repoPath}" `);
                console.error(err.message)
                const _error = new CheckoutError(err.message, repoPath, err.command, _sha);
                return of(_error);
            }
            throw err;
        }),
    );
}

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
export function checkoutAllReposAtDate$(folderPath: string, date: Date, options: CheckoutAllReposAtDateOptions) {
    const { concurrency, excludeRepoPaths, } = options;
    options.concurrency = options.concurrency || 1;
    type CheckedOutRepo = { repo: string, sha: string } & CmdExecuted;
    type ErroredRepo = { repo: string, sha: string } & CmdErrored;
    const checkedOutRepos: CheckedOutRepo[] = [];
    const erroredRepos: ErroredRepo[] = [];

    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    console.log(`Number of repos to be checkedout: ${repoPaths.length}`);

    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return checkoutRepoAtDate$(repoPath, date, options);
        }, concurrency),
        tap({
            next: (val) => {
                if (val instanceof CheckoutError) {
                    erroredRepos.push({ repo: val.repoPath, sha: val.sha, command: val.command, message: val.message });
                    return
                }
                checkedOutRepos.push({ repo: val.repoPath, sha: val.sha, command: `checkout ${val.sha}` });
            },
        }),
        last(),
        map(() => {
            console.log(`Checked out ${repoPaths.length - erroredRepos.length} repos of ${repoPaths.length}`);
            console.log(`Errored repos: ${erroredRepos.length}`);
            return { checkedOutRepos, erroredRepos }
        }),
    );
}
export type CheckoutAllReposAtDateOptions = {
    concurrency?: number,
    excludeRepoPaths?: string[],
    outDir?: string,
} & ExecuteCommandObsOptions

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
export function reposCompactInFolder$(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = 1,
    excludeRepoPaths: string[] = [],
) {
    const repoPaths = gitRepoPaths(folderPath, excludeRepoPaths);
    return from(repoPaths).pipe(
        toArray(),
        tap((repoPaths) => {
            console.log(`Repos to be analyzed: ${repoPaths.length}`);
            repoPaths.forEach((repoPath) => {
                console.log(`Repo to be analyzed: ${repoPath}`);
            });
        }),
        concatMap((repoPaths) => {
            return from(repoPaths);
        }),
        mergeMap((repoPath) => {
            return repoCompact$(repoPath, fromDate, toDate);
        }, concurrency),
    );
}

/**
 * Returns an Observable that notifies a new RepoCompact filled with its commits sorted by date ascending.
 * Only commits between the fromDate and toDate parameters are included.
 * @param repoPath The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @returns An Observable that notifies a new RepoCompact filled with its commits sorted by date ascending.
 */
export function repoCompact$(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return readCommitCompact$(repoPath, fromDate, toDate).pipe(
        toArray(),
        map((commits) => {
            const repo: RepoCompact = { path: repoPath, commits };
            return repo;
        }),
        catchError((err) => {
            console.error(
                `Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`,
            );
            return EMPTY;
        }),
    );
}

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
export function gitHttpsUrlFromGitUrl(gitUrl: string) {
    if (gitUrl.startsWith('https://')) return gitUrl;
    if (!gitUrl.startsWith('git@')) throw new Error(`gitUrl must start with "git@"`);

    const gitSshParts = gitUrl.split('@');
    const gitSshUrlWithoutInitialGit = gitSshParts[1];
    const gitSshUrlWithoutGitExtension = gitSshUrlWithoutInitialGit.replace(':', '/');
    const gitHttpsUrl = `https://${gitSshUrlWithoutGitExtension}`;
    return gitHttpsUrl;
}

/**
 * Returns an Observable that emits the remote origin url of a Git repository.
 * @param repoPath The path to the Git repository folder.
 * @returns An Observable that emits the remote origin url of the Git repository.
 */
export function getRemoteOriginUrl$(repoPath: string, options?: ExecuteCommandObsOptions) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return executeCommandObs('run git  config --get remote.origin.url', cmd, options).pipe(
        map((output) => {
            return output.split('\n')[0];
        }),
    );
}
