import path from "path";
import fs from "fs";
import { of } from "rxjs";
import { isToBeExcluded } from "../tools/strings-utils/is-to-be-excluded";


export function gitRepoPaths(startingFolder = './', excludeRepoPaths: string[] = []) {
    const repos = fetchAllGitReposFromGivenFolder(startingFolder).filter(r => !isToBeExcluded(r, excludeRepoPaths));
    console.log(`>>>>>>>>>> Found ${repos.length} git repos in ${startingFolder}`);
    return of(repos);
}

export function fetchAllDirsFromGivenFolder(fullPath: string) {
    let dirs: string[] = [];
    fs.readdirSync(fullPath).forEach((fileOrDir) => {
        const absolutePath = path.join(fullPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            dirs.push(absolutePath);
            const _subDirs = fetchAllDirsFromGivenFolder(absolutePath);
            dirs = dirs.concat(_subDirs);
        }
    });
    return dirs;
}

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
