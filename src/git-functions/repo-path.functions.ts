import path from "path";
import fs from "fs";

import { of } from "rxjs";

import { isToBeExcluded } from "../tools/strings-utils/is-to-be-excluded";

/**
 * Returns an array of paths to the Git repositories in a given folder, excluding those in the excludeRepoPaths array.
 * @param startingFolder The path to the folder containing the Git repositories. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An array of paths to the Git repositories in the given folder.
 */
export function gitRepoPaths(startingFolder = './', excludeRepoPaths: string[] = []) {
    const repos = fetchAllGitReposFromGivenFolder(startingFolder).filter(r => !isToBeExcluded(r, excludeRepoPaths));
    console.log(`>>>>>>>>>> Found ${repos.length} git repos in ${startingFolder}`);
    return repos;
}

/**
 * Returns an Observable that emits an array of paths to the Git repositories in a given folder, 
 * excluding those in the excludeRepoPaths array.
 * @param startingFolder The path to the folder containing the Git repositories. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits an array of paths to the Git repositories in the given folder.
 */
export function gitRepoPaths$(startingFolder = './', excludeRepoPaths: string[] = []) {
    const repos = gitRepoPaths(startingFolder, excludeRepoPaths);
    return of(repos);
}

/**
 * Recursively fetches all Git repositories in a given folder and its subfolders.
 * @param fullPath The path to the folder to search for Git repositories.
 * @returns An array of paths to the Git repositories found in the given folder and its subfolders.
 */
export function fetchAllGitReposFromGivenFolder(fullPath: string) {
    let gitRepos: string[] = [];
    const filesAndDirs = fs.readdirSync(fullPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepos.push(fullPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path.join(fullPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepos = fetchAllGitReposFromGivenFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
