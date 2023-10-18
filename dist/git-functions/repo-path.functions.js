"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllGitReposFromGivenFolder = exports.fetchAllDirsFromGivenFolder = exports.gitRepoPaths$ = exports.gitRepoPaths = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const rxjs_1 = require("rxjs");
const is_to_be_excluded_1 = require("../tools/strings-utils/is-to-be-excluded");
function gitRepoPaths(startingFolder = './', excludeRepoPaths = []) {
    const repos = fetchAllGitReposFromGivenFolder(startingFolder).filter(r => !(0, is_to_be_excluded_1.isToBeExcluded)(r, excludeRepoPaths));
    console.log(`>>>>>>>>>> Found ${repos.length} git repos in ${startingFolder}`);
    return repos;
}
exports.gitRepoPaths = gitRepoPaths;
function gitRepoPaths$(startingFolder = './', excludeRepoPaths = []) {
    const repos = gitRepoPaths(startingFolder, excludeRepoPaths);
    return (0, rxjs_1.of)(repos);
}
exports.gitRepoPaths$ = gitRepoPaths$;
function fetchAllDirsFromGivenFolder(fullPath) {
    let dirs = [];
    fs_1.default.readdirSync(fullPath).forEach((fileOrDir) => {
        const absolutePath = path_1.default.join(fullPath, fileOrDir);
        if (fs_1.default.statSync(absolutePath).isDirectory()) {
            dirs.push(absolutePath);
            const _subDirs = fetchAllDirsFromGivenFolder(absolutePath);
            dirs = dirs.concat(_subDirs);
        }
    });
    return dirs;
}
exports.fetchAllDirsFromGivenFolder = fetchAllDirsFromGivenFolder;
function fetchAllGitReposFromGivenFolder(fullPath) {
    let gitRepos = [];
    const filesAndDirs = fs_1.default.readdirSync(fullPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepos.push(fullPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path_1.default.join(fullPath, fileOrDir);
        if (fs_1.default.statSync(absolutePath).isDirectory()) {
            const subRepos = fetchAllGitReposFromGivenFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
exports.fetchAllGitReposFromGivenFolder = fetchAllGitReposFromGivenFolder;
//# sourceMappingURL=repo-path.functions.js.map