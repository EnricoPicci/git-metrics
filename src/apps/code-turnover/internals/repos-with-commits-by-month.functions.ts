import { EMPTY, catchError, from, map, mergeMap } from 'rxjs';

import { CommitCompact } from '../../../git-functions/commit.model';
import { repoCompact$ } from '../../../git-functions/repo';

import { RepoCompactWithCommitsByMonths, ReposWithCommitsByMonths } from './repos-with-commits-by-month.model';
import { newCommitsByMonth } from './commits-by-month.functions';
import { gitRepoPaths } from '../../../git-functions/repo-path';

// reposCompactWithCommitsByMonthsInFolderObs returns an Observable that notifies the list of
// RepoCompactWithCommitsByMonths objects representing all the repos in a given folder
export function reposCompactWithCommitsByMonthsInFolderObs(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = 1,
) {
    const repoPaths = gitRepoPaths(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate);
        }, concurrency),
    );
}

// newRepoCompactWithCommitsByMonths returns an Observable that notifies a new RepoCompactWithCommitsByMonths
// filled with its commits sorted by date ascending
export function newRepoCompactWithCommitsByMonths(
    repoPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
) {
    return repoCompact$(repoPath, fromDate, toDate).pipe(
        map((repoCompact) => {
            const _commitsByMonth = newCommitsByMonth(repoCompact.commits);
            const repo: RepoCompactWithCommitsByMonths = { ...repoCompact, commitsByMonth: _commitsByMonth };
            return repo;
        }),
        catchError((err) => {
            console.error(
                `Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`,
            );
            return EMPTY;
        }),
    );
}

// newReposWithCommitsByMonth retuns all the repos that have commits in a given month grouped by month
// #copilot - the entire method has been generated by copilot once I have specified the return type
export function newReposWithCommitsByMonth(repos: RepoCompactWithCommitsByMonths[]): ReposWithCommitsByMonths {
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
    }, {} as ReposWithCommitsByMonths);

    const reposByMonthOrdered = Object.keys(reposByMonthUnordered)
        .sort()
        .reduce((obj, key) => {
            obj[key] = reposByMonthUnordered[key];
            return obj;
        }, {} as ReposWithCommitsByMonths);

    const [firstYearMonth, lastYearMonth] = getMinMax(Object.keys(reposByMonthOrdered));
    fillMissingMonths(reposByMonthOrdered, firstYearMonth, lastYearMonth, []);
    return reposByMonthOrdered;
}

// fillMissingMonths fills the missing months in a given ReposWithCommitsByMonths object
// #copilot - the core of the method has been generated by copilot
export function fillMissingMonths(
    dict: { [yearMonth: string]: any },
    firstYearMonth: string,
    lastYearMonth: string,
    value: any,
) {
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
                if (yearMonthAsNumber(year, month) < firstYearMonthAsNumber) continue;
                if (yearMonthAsNumber(year, month) > lastYearMonthAsNumber) continue;
                dict[yearMonth] = value;
            }
        }
    }
}

function getMinMax(arr: string[]) {
    if (!arr || arr.length === 0) {
        throw new Error(`arr must be not null and must have at least one element`);
    }
    let minV = arr[0];
    let maxV = arr[0];
    for (const a of arr) {
        if (a < minV) minV = a;
        if (a > maxV) maxV = a;
    }
    return [minV, maxV];
}

function yearMonthAsNumber(year: number, month: number) {
    return year * 100 + month;
}

// repoCommitsByMonthRecordsDict returns a dictionary where the repo paths are the keys and the values are the commits grouped by month
export function repoCommitsByMonthRecordsDict(reposByMonths: ReposWithCommitsByMonths) {
    const records: { [repoPath: string]: { [yearMonth: string]: CommitCompact[] } } = {};

    // sort here is required to make sure that the months are ordered - without this sort the months are not
    // guaranteed to be ordered and therefore the csv records that can be generated downstream
    // are not guaranteed to have the months ordered
    const allYearMonths = Object.keys(reposByMonths)
        .sort()
        .reduce((acc, yearMonth) => {
            acc[yearMonth] = [];
            return acc;
        }, {} as { [yearMonth: string]: CommitCompact[] });

    const allReposPaths = Object.values(reposByMonths).reduce((acc, repos) => {
        repos.forEach((repo) => {
            if (!acc.includes(repo.repoPath)) {
                acc.push(repo.repoPath);
            }
        });
        return acc;
    }, [] as string[]);

    allReposPaths.forEach((repoPath) => {
        records[repoPath] = { ...allYearMonths };
    });

    Object.entries(reposByMonths).forEach(([yearMonth, repos]) => {
        repos.forEach((repo) => {
            const rec = records[repo.repoPath];
            rec[yearMonth] = repo.commits;
        });
    });
    return records;
}

// repoCommitsByMonthRecords returns an array of records that contain the repo path and the number of commits for each month
// such records are used to generate the csv file
export function repoCommitsByMonthRecords(reposByMonths: ReposWithCommitsByMonths) {
    const recordDict: { [repoPath: string]: { [yearMonth: string]: number } } = {};
    const _repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict(reposByMonths);

    Object.entries(_repoCommitsByMonthRecordsDict).forEach(([repoPath, repoCommitsByMonth]) => {
        const numOfCommitsByMonth: { [yearMonth: string]: number } = Object.entries(repoCommitsByMonth).reduce(
            (acc, [yearMonth, commits]) => {
                acc[yearMonth] = commits.length;
                return acc;
            },
            {} as { [yearMonth: string]: number },
        );

        recordDict[repoPath] = { ...numOfCommitsByMonth };
    });

    const records = Object.entries(recordDict).map(([repoPath, commitsByMonth]) => {
        return { repoPath, ...commitsByMonth };
    });

    return records;
}
