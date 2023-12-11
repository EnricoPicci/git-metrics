import { concatMap, filter, from, map } from "rxjs"

import { fileListObs } from "observable-fs"

import { gitRepoPaths } from "../git-functions/repo-path"

/**
 * Fetches all files with a specific extension from a directory and its subdirectories and returns an Observable 
 * that emits each file path along with its repository path.
 * @param fromDirPath The path to the directory to fetch the files from.
 * @param extension The extension of the files to fetch.
 * @returns An Observable that emits an object for each file. The object contains the repository path and the file path.
 */
export function allFilesWithRepos$(fromDirPath: string, extension: string, excludeRepoPaths?: string[]) {
    const _extension = extension.startsWith('.') ? extension : '.' + extension
    const repoPaths = gitRepoPaths(fromDirPath, excludeRepoPaths)
    return from(repoPaths).pipe(
        concatMap((repoPath) => {
            // read all the files in the repoPath
            return fileListObs(repoPath).pipe(
                concatMap(files => from(files).pipe(
                    filter((file) => file.endsWith(_extension)),
                    map((javaFile) => ({ repoPath, javaFile }))
                ))
            )
        }),
    )
}