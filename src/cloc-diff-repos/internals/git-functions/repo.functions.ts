import { EMPTY, catchError, concatMap, filter, from, map, mergeMap, tap, toArray } from 'rxjs';

import { executeCommandObs, getCommandOutput } from '../execute-command/execute-command';
import { newCommitsByMonth, fetchCommits, buildCommitPairArray } from './commit.functions';
import { RepoCompact, RepoCompactWithCommitPairs, RepoCompactWithCommitsByMonths, ReposWithCommitsByMonths } from './repo.model';
import { CommitCompact } from './commit.model';
import { reposInFolder } from '../repos-functions/repos-in-folder';

// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
export function cloneRepo(url: string, repoPath: string, repoName: string) {
    if (!url) throw new Error(`url is mandatory`);
    if (!repoPath) throw new Error(`Path is mandatory`);

    const command = `git clone ${url} ${repoPath.replaceAll(' ', '_')}`;

    return executeCommandObs(`Clone ${repoName}`, command).pipe(
        tap(() => `${repoName} cloned`),
        map(() => repoPath),
        catchError((err) => {
            console.error(`!!!!!!!!!!!!!!! Error: while cloning repo "${repoName}" - error code: ${err.code}`)
            console.error(`!!!!!!!!!!!!!!! Command erroring: "${command}"`)
            return EMPTY
        })
    );
}

// reposCompactInFolderObs returns an Observable that notifies the list of 
// RepoCompact objects representing all the repos in a given folder
// repos whose name is in the excludeRepoPaths array are excluded, in the excludeRepoPaths array
// wildcards can be used, e.g. ['repo1', 'repo2', 'repo3*'] will exclude repo1, repo2 and all the repos that start with repo3
export function reposCompactInFolderObs(
    folderPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = 1,
    excludeRepoPaths: string[] = []
) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        filter((repoPath) => {
            return !isToBeExcluded(repoPath, excludeRepoPaths)
        }),
        toArray(),
        tap((repoPaths) => {
            console.log(`Repos to be analyzed: ${repoPaths.length}`)
            repoPaths.forEach((repoPath) => {
                console.log(`Repo to be analyzed: ${repoPath}`)
            })
        }),
        concatMap((repoPaths) => {
            return from(repoPaths)
        }),
        mergeMap((repoPath) => {
            return newRepoCompact(repoPath, fromDate, toDate)
        }, concurrency),
    )
}

// isToBeExcluded returns true if the name of the repo is in the excludeRepoPaths array
export function isToBeExcluded(repoPath: string, excludeRepoPaths: string[]) {
    const excludeRepoPathsLowerCase = excludeRepoPaths.map((excludeRepo) => excludeRepo.toLowerCase())
    const repoPathLowerCase = repoPath.toLowerCase()
    return excludeRepoPathsLowerCase.some((excludeRepo) => {
        if (excludeRepo.includes('*')) {
            const excludeRepoRegex = new RegExp(excludeRepo.replace('*', '.*'))
            return excludeRepoRegex.test(repoPathLowerCase)
        } else {
            return repoPathLowerCase === excludeRepo
        }
    })
}

// reposCompactWithCommitsByMonthsInFolderObs returns an Observable that notifies the list of 
// RepoCompactWithCommitsByMonths objects representing all the repos in a given folder
export function reposCompactWithCommitsByMonthsInFolderObs(folderPath: string, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = 1) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate)
        }, concurrency),
    )
}

// newRepoCompact returns an Observable that notifies a new RepoCompact
// filled with its commits sorted by date ascending
export function newRepoCompact(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return fetchCommits(repoPath, fromDate, toDate).pipe(
        toArray(),
        map((commits) => {
            const repo: RepoCompact = { path: repoPath, commits }
            return repo
        }),
        catchError((err) => {
            console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`)
            return EMPTY
        })
    );
}

// newRepoCompactWithCommitPairs is a function that receives a RepoCompact and returns a RepoCompactWithCommitPairs
// with the commitPairs filled
export function newRepoCompactWithCommitPairs(repoCompact: RepoCompact) {
    const commits = repoCompact.commits
    const commitPairs = buildCommitPairArray(commits, repoCompact.path)
    const repoCompactWithCommitPairs: RepoCompactWithCommitPairs = { ...repoCompact, commitPairs }
    return repoCompactWithCommitPairs
}

// newRepoCompactWithCommitsByMonths returns an Observable that notifies a new RepoCompactWithCommitsByMonths
// filled with its commits sorted by date ascending
export function newRepoCompactWithCommitsByMonths(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
    return newRepoCompact(repoPath, fromDate, toDate).pipe(
        map((repoCompact) => {
            const _commitsByMonth = newCommitsByMonth(repoCompact.commits)
            const repo: RepoCompactWithCommitsByMonths = { ...repoCompact, commitsByMonth: _commitsByMonth }
            return repo
        }),
        catchError((err) => {
            console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`)
            return EMPTY
        })
    );
}

// newReposWithCommitsByMonth retuns all the repos that have commits in a given month grouped by month
// #copilot - the entire method has been generated by copilot once I have specified the return type
export function newReposWithCommitsByMonth(repos: RepoCompactWithCommitsByMonths[]): ReposWithCommitsByMonths {
    const reposByMonthUnordered = repos.reduce((acc, repo) => {
        Object.keys(repo.commitsByMonth).forEach((yearMonth) => {
            if (!acc[yearMonth]) {
                acc[yearMonth] = []
            }
            acc[yearMonth].push({
                repoPath: repo.path,
                commits: repo.commitsByMonth[yearMonth].commits,
                authors: Array.from(repo.commitsByMonth[yearMonth].authors)
            })
        })
        return acc
    }, {} as ReposWithCommitsByMonths)

    const reposByMonthOrdered = Object.keys(reposByMonthUnordered).sort().reduce(
        (obj, key) => {
            obj[key] = reposByMonthUnordered[key];
            return obj;
        }, {} as ReposWithCommitsByMonths);

    const [firstYearMonth, lastYearMonth] = getMinMax(Object.keys(reposByMonthOrdered))
    fillMissingMonths(reposByMonthOrdered, firstYearMonth, lastYearMonth, [])
    return reposByMonthOrdered
}

// fillMissingMonths fills the missing months in a given ReposWithCommitsByMonths object
// #copilot - the core of the method has been generated by copilot
export function fillMissingMonths(dict: { [yearMonth: string]: any }, firstYearMonth: string, lastYearMonth: string, value: any) {
    const firstYear = parseInt(firstYearMonth.split('-')[0])
    const firstMonth = parseInt(firstYearMonth.split('-')[1])
    const firstYearMonthAsNumber = yearMonthAsNumber(firstYear, firstMonth)

    const lastYear = parseInt(lastYearMonth.split('-')[0])
    const lastMonth = parseInt(lastYearMonth.split('-')[1])
    const lastYearMonthAsNumber = yearMonthAsNumber(lastYear, lastMonth)

    for (let year = firstYear; year <= lastYear; year++) {
        for (let month = 1; month <= 12; month++) {
            const yearMonth = `${year}-${month.toString().padStart(2, '0')}`
            if (!dict[yearMonth]) {
                if (yearMonthAsNumber(year, month) < firstYearMonthAsNumber) continue
                if (yearMonthAsNumber(year, month) > lastYearMonthAsNumber) continue
                dict[yearMonth] = value
            }
        }
    }
}

function getMinMax(arr: string[]) {
    if (!arr || arr.length === 0) {
        throw new Error(`arr must be not null and must have at least one element`);
    }
    var minV = arr[0];
    var maxV = arr[0];
    for (let a of arr) {
        if (a < minV) minV = a;
        if (a > maxV) maxV = a;
    }
    return [minV, maxV];
}

function yearMonthAsNumber(year: number, month: number) {
    return year * 100 + month
}

// repoCommitsByMonthRecordsDict returns a dictionary where the repo paths are the keys and the values are the commits grouped by month
export function repoCommitsByMonthRecordsDict(reposByMonths: ReposWithCommitsByMonths) {
    const records: { [repoPath: string]: { [yearMonth: string]: CommitCompact[] } } = {}

    // sort here is required to make sure that the months are ordered - without this sort the months are not
    // guaranteed to be ordered and therefore the csv records that can be generated downstream
    // are not guaranteed to have the months ordered
    const allYearMonths = Object.keys(reposByMonths).sort().reduce((acc, yearMonth) => {
        acc[yearMonth] = []
        return acc
    }, {} as { [yearMonth: string]: CommitCompact[] })

    const allReposPaths = Object.values(reposByMonths).reduce((acc, repos) => {
        repos.forEach((repo) => {
            if (!acc.includes(repo.repoPath)) {
                acc.push(repo.repoPath)
            }
        })
        return acc
    }, [] as string[])

    allReposPaths.forEach((repoPath) => {
        records[repoPath] = { ...allYearMonths }
    })

    Object.entries(reposByMonths).forEach(([yearMonth, repos]) => {
        repos.forEach((repo) => {
            const rec = records[repo.repoPath]
            rec[yearMonth] = repo.commits
        })
    })
    return records
}

// repoCommitsByMonthRecords returns an array of records that contain the repo path and the number of commits for each month
// such records are used to generate the csv file
export function repoCommitsByMonthRecords(reposByMonths: ReposWithCommitsByMonths) {
    const recordDict: { [repoPath: string]: { [yearMonth: string]: number } } = {}
    const _repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict(reposByMonths)

    Object.entries(_repoCommitsByMonthRecordsDict).forEach(([repoPath, repoCommitsByMonth]) => {
        const numOfCommitsByMonth: { [yearMonth: string]: number } = Object.entries(repoCommitsByMonth).reduce((acc, [yearMonth, commits]) => {
            acc[yearMonth] = commits.length
            return acc
        }, {} as { [yearMonth: string]: number })

        recordDict[repoPath] = { ...numOfCommitsByMonth }
    })

    const records = Object.entries(recordDict).map(([repoPath, commitsByMonth]) => {
        return { repoPath, ...commitsByMonth }
    })

    return records
}

// gitHttpsUrlFromGitSshUrl returns the https url of a repo given its ssh url
// e.g.
// git@git.ad.rgigroup.com:vita/dbobjects-passvita.git
// becomes
// https://git.ad.rgigroup.com/vita/dbobjects-passvita.git
//
// if the input is already an https url, the same url is returned
export function gitHttpsUrlFromGitUrl(gitUrl: string) {
    if (gitUrl.startsWith('https://')) return gitUrl
    if (!gitUrl.startsWith('git@')) throw new Error(`gitUrl must start with "git@"`)

    const gitSshParts = gitUrl.split('@')
    const gitSshUrlWithoutInitialGit = gitSshParts[1]
    const gitSshUrlWithoutGitExtension = gitSshUrlWithoutInitialGit.replace(':', '/')
    const gitHttpsUrl = `https://${gitSshUrlWithoutGitExtension}`
    return gitHttpsUrl
}

// getRemoteOriginUrl returns the remote origin url of a repo
export function getRemoteOriginUrl(repoPath: string, verbose = true) {
    const cmd = `cd ${repoPath} && git config --get remote.origin.url`
    return executeCommandObs(
        'run git  config --get remote.origin.url', cmd
    ).pipe(
        toArray(),
        map((linesFromStdOutAndStdErr) => {
            const output = getCommandOutput(linesFromStdOutAndStdErr, repoPath, cmd)
            return output.split('\n')[0]
        }),
        catchError((error) => {
            const err = `Error in getRemoteOriginUrl for repo "${repoPath}"\nError: ${error}`
            if (verbose) console.error(err)
            // in case of error we return an error
            throw new Error(err)
        })
    )
}
