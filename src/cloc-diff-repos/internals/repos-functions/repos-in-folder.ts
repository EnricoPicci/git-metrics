import * as fs from 'fs';
import path from 'path';

// reposInFolder returns the list of git repos paths in a given folder
export function reposInFolder(folderPath: string) {
    let gitRepos: string[] = [];
    const filesAndDirs = fs.readdirSync(folderPath)
    if (filesAndDirs.some(fileOrDir => fileOrDir === '.git')) {
        gitRepos.push(folderPath);
    }
    filesAndDirs.forEach(fileOrDir => {
        const absolutePath = path.join(folderPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepos = reposInFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos
}