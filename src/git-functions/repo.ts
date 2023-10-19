import fs from 'fs';
import path from 'path';

import { tap, map, catchError, EMPTY, concatMap, from, mergeMap, toArray } from 'rxjs';

import { executeCommandObs } from '../tools/execute-command/execute-command';

import { RepoCompact } from './repo.model';
import { readCommitCompact$ } from './commit';
import { gitRepoPaths } from './repo-path.functions';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


/**
 * Returns the list of Git repository paths in a given folder, including subfolders.
 * If a folder has a .git folder, it is considered a Git repository.
 * @param folderPath The path to the folder to search for Git repositories.
 * @returns An array of Git repository paths.
 */
export function reposInFolder(folderPath: string) {
    let gitRepoPaths: string[] = [];
    const filesAndDirs = fs.readdirSync(folderPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepoPaths.push(folderPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path.join(folderPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepoPaths = reposInFolder(absolutePath);
            gitRepoPaths = gitRepoPaths.concat(subRepoPaths);
        }
    });
    return gitRepoPaths;
}

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
        map(() => repoPath),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`);
            console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
            return EMPTY;
        }),
    );
}

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
export function getRemoteOriginUrl$(repoPath: string) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return executeCommandObs('run git  config --get remote.origin.url', cmd).pipe(
        map((output) => {
            return output.split('\n')[0];
        }),
    );
}
