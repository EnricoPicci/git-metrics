import { allFilesWithRepos$ } from "../fs-functions/files"

/**
 * Fetches all Java files from a directory and its subdirectories and returns an Observable that emits 
 * each Java file path along with its repository path.
 * @param fromDirPath The path to the directory to fetch the Java files from.
 * @returns An Observable that emits an object for each Java file. The object contains the repository path and the Java file path.
 */
export function allJavaFiles(fromDirPath: string, excludeRepoPaths?: string[]) {
    return allFilesWithRepos$(fromDirPath, '.java', excludeRepoPaths)
}