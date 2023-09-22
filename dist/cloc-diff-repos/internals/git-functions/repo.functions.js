"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteOriginUrl = exports.gitHttpsUrlFromGitUrl = exports.repoCommitsByMonthRecords = exports.repoCommitsByMonthRecordsDict = exports.fillMissingMonths = exports.newReposWithCommitsByMonth = exports.newRepoCompactWithCommitsByMonths = exports.newRepoCompactWithCommitPairs = exports.newRepoCompact = exports.reposCompactWithCommitsByMonthsInFolderObs = exports.isToBeExcluded = exports.reposCompactInFolderObs = exports.cloneRepo = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../../../0-tools/execute-command/execute-command");
const commit_functions_1 = require("./commit.functions");
const repos_in_folder_1 = require("../repos-functions/repos-in-folder");
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
    const repoPaths = (0, repos_in_folder_1.reposInFolder)(folderPath);
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
// reposCompactWithCommitsByMonthsInFolderObs returns an Observable that notifies the list of 
// RepoCompactWithCommitsByMonths objects representing all the repos in a given folder
function reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1) {
    const repoPaths = (0, repos_in_folder_1.reposInFolder)(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactWithCommitsByMonthsInFolderObs = reposCompactWithCommitsByMonthsInFolderObs;
// newRepoCompact returns an Observable that notifies a new RepoCompact
// filled with its commits sorted by date ascending
function newRepoCompact(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return (0, commit_functions_1.fetchCommits)(repoPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((commits) => {
        const repo = { path: repoPath, commits };
        return repo;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.EMPTY;
    }));
}
exports.newRepoCompact = newRepoCompact;
// newRepoCompactWithCommitPairs is a function that receives a RepoCompact and returns a RepoCompactWithCommitPairs
// with the commitPairs filled
function newRepoCompactWithCommitPairs(repoCompact) {
    const commits = repoCompact.commits;
    const commitPairs = (0, commit_functions_1.buildCommitPairArray)(commits, repoCompact.path);
    const repoCompactWithCommitPairs = Object.assign(Object.assign({}, repoCompact), { commitPairs });
    return repoCompactWithCommitPairs;
}
exports.newRepoCompactWithCommitPairs = newRepoCompactWithCommitPairs;
// newRepoCompactWithCommitsByMonths returns an Observable that notifies a new RepoCompactWithCommitsByMonths
// filled with its commits sorted by date ascending
function newRepoCompactWithCommitsByMonths(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return newRepoCompact(repoPath, fromDate, toDate).pipe((0, rxjs_1.map)((repoCompact) => {
        const _commitsByMonth = (0, commit_functions_1.newCommitsByMonth)(repoCompact.commits);
        const repo = Object.assign(Object.assign({}, repoCompact), { commitsByMonth: _commitsByMonth });
        return repo;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.EMPTY;
    }));
}
exports.newRepoCompactWithCommitsByMonths = newRepoCompactWithCommitsByMonths;
// newReposWithCommitsByMonth retuns all the repos that have commits in a given month grouped by month
// #copilot - the entire method has been generated by copilot once I have specified the return type
function newReposWithCommitsByMonth(repos) {
    const reposByMonthUnordered = repos.reduce((acc, repo) => {
        Object.keys(repo.commitsByMonth).forEach((yearMonth) => {
            if (!acc[yearMonth]) {
                acc[yearMonth] = [];
            }
            acc[yearMonth].push({
                repoPath: repo.path,
                commits: repo.commitsByMonth[yearMonth].commits,
                authors: Array.from(repo.commitsByMonth[yearMonth].authors)
            });
        });
        return acc;
    }, {});
    const reposByMonthOrdered = Object.keys(reposByMonthUnordered).sort().reduce((obj, key) => {
        obj[key] = reposByMonthUnordered[key];
        return obj;
    }, {});
    const [firstYearMonth, lastYearMonth] = getMinMax(Object.keys(reposByMonthOrdered));
    fillMissingMonths(reposByMonthOrdered, firstYearMonth, lastYearMonth, []);
    return reposByMonthOrdered;
}
exports.newReposWithCommitsByMonth = newReposWithCommitsByMonth;
// fillMissingMonths fills the missing months in a given ReposWithCommitsByMonths object
// #copilot - the core of the method has been generated by copilot
function fillMissingMonths(dict, firstYearMonth, lastYearMonth, value) {
    const firstYear = parseInt(firstYearMonth.split('-')[0]);
    const firstMonth = parseInt(firstYearMonth.split('-')[1]);
    const firstYearMonthAsNumber = yearMonthAsNumber(firstYear, firstMonth);
    const lastYear = parseInt(lastYearMonth.split('-')[0]);
    const lastMonth = parseInt(lastYearMonth.split('-')[1]);
    const lastYearMonthAsNumber = yearMonthAsNumber(lastYear, lastMonth);
    for (let year = firstYear; year <= lastYear; year++) {
        for (let month = 1; month <= 12; month++) {
            const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
            if (!dict[yearMonth]) {
                if (yearMonthAsNumber(year, month) < firstYearMonthAsNumber)
                    continue;
                if (yearMonthAsNumber(year, month) > lastYearMonthAsNumber)
                    continue;
                dict[yearMonth] = value;
            }
        }
    }
}
exports.fillMissingMonths = fillMissingMonths;
function getMinMax(arr) {
    if (!arr || arr.length === 0) {
        throw new Error(`arr must be not null and must have at least one element`);
    }
    var minV = arr[0];
    var maxV = arr[0];
    for (let a of arr) {
        if (a < minV)
            minV = a;
        if (a > maxV)
            maxV = a;
    }
    return [minV, maxV];
}
function yearMonthAsNumber(year, month) {
    return year * 100 + month;
}
// repoCommitsByMonthRecordsDict returns a dictionary where the repo paths are the keys and the values are the commits grouped by month
function repoCommitsByMonthRecordsDict(reposByMonths) {
    const records = {};
    // sort here is required to make sure that the months are ordered - without this sort the months are not
    // guaranteed to be ordered and therefore the csv records that can be generated downstream
    // are not guaranteed to have the months ordered
    const allYearMonths = Object.keys(reposByMonths).sort().reduce((acc, yearMonth) => {
        acc[yearMonth] = [];
        return acc;
    }, {});
    const allReposPaths = Object.values(reposByMonths).reduce((acc, repos) => {
        repos.forEach((repo) => {
            if (!acc.includes(repo.repoPath)) {
                acc.push(repo.repoPath);
            }
        });
        return acc;
    }, []);
    allReposPaths.forEach((repoPath) => {
        records[repoPath] = Object.assign({}, allYearMonths);
    });
    Object.entries(reposByMonths).forEach(([yearMonth, repos]) => {
        repos.forEach((repo) => {
            const rec = records[repo.repoPath];
            rec[yearMonth] = repo.commits;
        });
    });
    return records;
}
exports.repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict;
// repoCommitsByMonthRecords returns an array of records that contain the repo path and the number of commits for each month
// such records are used to generate the csv file
function repoCommitsByMonthRecords(reposByMonths) {
    const recordDict = {};
    const _repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict(reposByMonths);
    Object.entries(_repoCommitsByMonthRecordsDict).forEach(([repoPath, repoCommitsByMonth]) => {
        const numOfCommitsByMonth = Object.entries(repoCommitsByMonth).reduce((acc, [yearMonth, commits]) => {
            acc[yearMonth] = commits.length;
            return acc;
        }, {});
        recordDict[repoPath] = Object.assign({}, numOfCommitsByMonth);
    });
    const records = Object.entries(recordDict).map(([repoPath, commitsByMonth]) => {
        return Object.assign({ repoPath }, commitsByMonth);
    });
    return records;
}
exports.repoCommitsByMonthRecords = repoCommitsByMonthRecords;
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
function getRemoteOriginUrl(repoPath, verbose = true) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`;
    return (0, execute_command_1.executeCommandObs)('run git  config --get remote.origin.url', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((linesFromStdOutAndStdErr) => {
        const output = (0, execute_command_1.getCommandOutput)(linesFromStdOutAndStdErr, repoPath, cmd);
        return output.split('\n')[0];
    }), (0, rxjs_1.catchError)((error) => {
        const err = `Error in getRemoteOriginUrl for repo "${repoPath}"\nError: ${error}`;
        if (verbose)
            console.error(err);
        // in case of error we return an error
        throw new Error(err);
    }));
}
exports.getRemoteOriginUrl = getRemoteOriginUrl;
//# sourceMappingURL=repo.functions.js.map