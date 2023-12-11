"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allFilesWithRepos$ = void 0;
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const repo_path_1 = require("../git-functions/repo-path");
/**
 * Fetches all files with a specific extension from a directory and its subdirectories and returns an Observable
 * that emits each file path along with its repository path.
 * @param fromDirPath The path to the directory to fetch the files from.
 * @param extension The extension of the files to fetch.
 * @returns An Observable that emits an object for each file. The object contains the repository path and the file path.
 */
function allFilesWithRepos$(fromDirPath, extension, excludeRepoPaths) {
    const _extension = extension.startsWith('.') ? extension : '.' + extension;
    const repoPaths = (0, repo_path_1.gitRepoPaths)(fromDirPath, excludeRepoPaths);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.concatMap)((repoPath) => {
        // read all the files in the repoPath
        return (0, observable_fs_1.fileListObs)(repoPath).pipe((0, rxjs_1.concatMap)(files => (0, rxjs_1.from)(files).pipe((0, rxjs_1.filter)((file) => file.endsWith(_extension)), (0, rxjs_1.map)((javaFile) => ({ repoPath, javaFile })))));
    }));
}
exports.allFilesWithRepos$ = allFilesWithRepos$;
//# sourceMappingURL=files.js.map