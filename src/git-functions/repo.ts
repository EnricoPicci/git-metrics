import fs from 'fs';
import path from 'path';

import { tap, map, catchError, EMPTY, concatMap, from, mergeMap, toArray } from 'rxjs';

import { executeCommandObs } from '../tools/execute-command/execute-command';

import { RepoCompact } from './repo.model';
import { readCommitCompact$ } from './commit';
import { gitRepoPaths } from './repo-path.functions';

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
export function cloneRepo(url: string, repoPath: string, repoName: string) {
    if (!url) throw new Error(`url is mandatory`);
    if (!repoPath) throw new Error(`Path is mandatory`);

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

// reposCompactInFolderObs returns an Observable that notifies the list of
// RepoCompact objects representing all the repos in a given folder
// repos whose name is in the excludeRepoPaths array are excluded, in the excludeRepoPaths array
// wildcards can be used, e.g. ['repo1', 'repo2', 'repo3*'] will exclude repo1, repo2 and all the repos that start with repo3
export function reposCompactInFolderObs(
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
            return newRepoCompact(repoPath, fromDate, toDate);
        }, concurrency),
    );
}

// newRepoCompact returns an Observable that notifies a new RepoCompact
// filled with its commits sorted by date ascending
export function newRepoCompact(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
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

// gitHttpsUrlFromGitSshUrl returns the https url of a repo given its ssh url
// e.g.
// git@git.ad.rgigroup.com:vita/dbobjects-passvita.git
// becomes
// https://git.ad.rgigroup.com/vita/dbobjects-passvita.git
//
// if the input is already an https url, the same url is returned
export function gitHttpsUrlFromGitUrl(gitUrl: string) {
    if (gitUrl.startsWith('https://')) return gitUrl;
    if (!gitUrl.startsWith('git@')) throw new Error(`gitUrl must start with "git@"`);

    const gitSshParts = gitUrl.split('@');
    const gitSshUrlWithoutInitialGit = gitSshParts[1];
    const gitSshUrlWithoutGitExtension = gitSshUrlWithoutInitialGit.replace(':', '/');
    const gitHttpsUrl = `https://${gitSshUrlWithoutGitExtension}`;
    return gitHttpsUrl;
}

// getRemoteOriginUrl returns the remote origin url of a repo
export function getRemoteOriginUrl(repoPath: string) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return executeCommandObs('run git  config --get remote.origin.url', cmd).pipe(
        map((output) => {
            return output.split('\n')[0];
        }),
    );
}