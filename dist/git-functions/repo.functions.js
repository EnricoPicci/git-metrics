"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteOriginUrl = exports.gitHttpsUrlFromGitUrl = exports.newRepoCompact = exports.isToBeExcluded = exports.reposCompactInFolderObs = exports.cloneRepo = exports.reposInFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const commit_functions_1 = require("./commit.functions");
// reposInFolder returns the list of git repos paths in a given folder including subfolders
function reposInFolder(folderPath) {
    let gitRepos = [];
    const filesAndDirs = fs_1.default.readdirSync(folderPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepos.push(folderPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path_1.default.join(folderPath, fileOrDir);
        if (fs_1.default.statSync(absolutePath).isDirectory()) {
            const subRepos = reposInFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
exports.reposInFolder = reposInFolder;
// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
function cloneRepo(url, repoPath, repoName) {
    if (!url)
        throw new Error(`url is mandatory`);
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const command = `git clone ${url} ${repoPath.replaceAll(' ', '_')}`;
    return (0, execute_command_1.executeCommandObs)(`Clone ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} cloned`), (0, rxjs_1.map)(() => repoPath), (0, rxjs_1.catchError)((err) => {
        console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`);
        console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`);
        return rxjs_1.EMPTY;
    }));
}
exports.cloneRepo = cloneRepo;
// reposCompactInFolderObs returns an Observable that notifies the list of
// RepoCompact objects representing all the repos in a given folder
// repos whose name is in the excludeRepoPaths array are excluded, in the excludeRepoPaths array
// wildcards can be used, e.g. ['repo1', 'repo2', 'repo3*'] will exclude repo1, repo2 and all the repos that start with repo3
function reposCompactInFolderObs(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1, excludeRepoPaths = []) {
    const repoPaths = reposInFolder(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.filter)((repoPath) => {
        return !isToBeExcluded(repoPath, excludeRepoPaths);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((repoPaths) => {
        console.log(`Repos to be analyzed: ${repoPaths.length}`);
        repoPaths.forEach((repoPath) => {
            console.log(`Repo to be analyzed: ${repoPath}`);
        });
    }), (0, rxjs_1.concatMap)((repoPaths) => {
        return (0, rxjs_1.from)(repoPaths);
    }), (0, rxjs_1.mergeMap)((repoPath) => {
        return newRepoCompact(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactInFolderObs = reposCompactInFolderObs;
// isToBeExcluded returns true if the name of the repo is in the excludeRepoPaths array
function isToBeExcluded(repoPath, excludeRepoPaths) {
    const excludeRepoPathsLowerCase = excludeRepoPaths.map((excludeRepo) => excludeRepo.toLowerCase());
    const repoPathLowerCase = repoPath.toLowerCase();
    return excludeRepoPathsLowerCase.some((excludeRepo) => {
        if (excludeRepo.includes('*')) {
            const excludeRepoRegex = new RegExp(excludeRepo.replace('*', '.*'));
            return excludeRepoRegex.test(repoPathLowerCase);
        }
        else {
            return repoPathLowerCase === excludeRepo;
        }
    });
}
exports.isToBeExcluded = isToBeExcluded;
// newRepoCompact returns an Observable that notifies a new RepoCompact
// filled with its commits sorted by date ascending
function newRepoCompact(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return (0, commit_functions_1.readCommitFromLog$)(repoPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((commits) => {
        const repo = { path: repoPath, commits };
        return repo;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.EMPTY;
    }));
}
exports.newRepoCompact = newRepoCompact;
// gitHttpsUrlFromGitSshUrl returns the https url of a repo given its ssh url
// e.g.
// git@git.ad.rgigroup.com:vita/dbobjects-passvita.git
// becomes
// https://git.ad.rgigroup.com/vita/dbobjects-passvita.git
//
// if the input is already an https url, the same url is returned
function gitHttpsUrlFromGitUrl(gitUrl) {
    if (gitUrl.startsWith('https://'))
        return gitUrl;
    if (!gitUrl.startsWith('git@'))
        throw new Error(`gitUrl must start with "git@"`);
    const gitSshParts = gitUrl.split('@');
    const gitSshUrlWithoutInitialGit = gitSshParts[1];
    const gitSshUrlWithoutGitExtension = gitSshUrlWithoutInitialGit.replace(':', '/');
    const gitHttpsUrl = `https://${gitSshUrlWithoutGitExtension}`;
    return gitHttpsUrl;
}
exports.gitHttpsUrlFromGitUrl = gitHttpsUrlFromGitUrl;
// getRemoteOriginUrl returns the remote origin url of a repo
function getRemoteOriginUrl(repoPath) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return (0, execute_command_1.executeCommandObs)('run git  config --get remote.origin.url', cmd).pipe((0, rxjs_1.map)((output) => {
        return output.split('\n')[0];
    }));
}
exports.getRemoteOriginUrl = getRemoteOriginUrl;
//# sourceMappingURL=repo.functions.js.map