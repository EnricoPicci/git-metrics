"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllGitReposFromGivenFolder = exports.gitRepoPaths$ = exports.gitRepoPaths = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const rxjs_1 = require("rxjs");
const is_to_be_excluded_1 = require("../tools/strings-utils/is-to-be-excluded");
/**
 * Returns an array of paths to the Git repositories in a given folder, excluding those in the excludeRepoPaths array.
 * @param startingFolder The path to the folder containing the Git repositories. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An array of paths to the Git repositories in the given folder.
 */
function gitRepoPaths(startingFolder = './', excludeRepoPaths = []) {
    const repos = fetchAllGitReposFromGivenFolder(startingFolder).filter(r => !(0, is_to_be_excluded_1.isToBeExcluded)(r, excludeRepoPaths));
    console.log(`>>>>>>>>>> Found ${repos.length} git repos in ${startingFolder}`);
    return repos;
}
exports.gitRepoPaths = gitRepoPaths;
/**
 * Returns an Observable that emits an array of paths to the Git repositories in a given folder,
 * excluding those in the excludeRepoPaths array.
 * @param startingFolder The path to the folder containing the Git repositories. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository names to exclude. Wildcards can be used. Defaults to an empty array.
 * @returns An Observable that emits an array of paths to the Git repositories in the given folder.
 */
function gitRepoPaths$(startingFolder = './', excludeRepoPaths = []) {
    const repos = gitRepoPaths(startingFolder, excludeRepoPaths);
    return (0, rxjs_1.of)(repos);
}
exports.gitRepoPaths$ = gitRepoPaths$;
/**
 * Recursively fetches all Git repositories in a given folder and its subfolders.
 * @param fullPath The path to the folder to search for Git repositories.
 * @returns An array of paths to the Git repositories found in the given folder and its subfolders.
 */
function fetchAllGitReposFromGivenFolder(fullPath) {
    let gitRepos = [];
    const filesAndDirs = fs_1.default.readdirSync(fullPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepos.push(fullPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path_1.default.join(fullPath, fileOrDir);
        let fStats;
        // we have seen situations where fs.statSync throws an error even though the file is returned by fs.readdirSync
        // so we catch the error and log it, but we do not throw it
        try {
            fStats = fs_1.default.statSync(absolutePath);
        }
        catch (err) {
            // in the case we have seen the error code is ENOENT and the errno is -2
            if (err.code === 'ENOENT' && err.errno === -2) {
                console.error(`Error: ${err.message} for path ${absolutePath}`);
                return gitRepos;
            }
            throw err;
        }
        if (fStats.isDirectory()) {
            const subRepos = fetchAllGitReposFromGivenFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
exports.fetchAllGitReposFromGivenFolder = fetchAllGitReposFromGivenFolder;
//# sourceMappingURL=repo-path.js.map