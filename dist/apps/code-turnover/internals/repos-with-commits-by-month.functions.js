"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoCommitsByMonthRecords = exports.repoCommitsByMonthRecordsDict = exports.fillMissingMonths = exports.newReposWithCommitsByMonth = exports.newRepoCompactWithCommitsByMonths = exports.reposCompactWithCommitsByMonthsInFolderObs = void 0;
const rxjs_1 = require("rxjs");
const repo_1 = require("../../../git-functions/repo");
const commits_by_month_functions_1 = require("./commits-by-month.functions");
// reposCompactWithCommitsByMonthsInFolderObs returns an Observable that notifies the list of
// RepoCompactWithCommitsByMonths objects representing all the repos in a given folder
function reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1) {
    const repoPaths = (0, repo_1.reposInFolder)(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactWithCommitsByMonthsInFolderObs = reposCompactWithCommitsByMonthsInFolderObs;
// newRepoCompactWithCommitsByMonths returns an Observable that notifies a new RepoCompactWithCommitsByMonths
// filled with its commits sorted by date ascending
function newRepoCompactWithCommitsByMonths(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return (0, repo_1.newRepoCompact)(repoPath, fromDate, toDate).pipe((0, rxjs_1.map)((repoCompact) => {
        const _commitsByMonth = (0, commits_by_month_functions_1.newCommitsByMonth)(repoCompact.commits);
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
                authors: Array.from(repo.commitsByMonth[yearMonth].authors),
            });
        });
        return acc;
    }, {});
    const reposByMonthOrdered = Object.keys(reposByMonthUnordered)
        .sort()
        .reduce((obj, key) => {
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
    let minV = arr[0];
    let maxV = arr[0];
    for (const a of arr) {
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
    const allYearMonths = Object.keys(reposByMonths)
        .sort()
        .reduce((acc, yearMonth) => {
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
//# sourceMappingURL=repos-with-commits-by-month.functions.js.map