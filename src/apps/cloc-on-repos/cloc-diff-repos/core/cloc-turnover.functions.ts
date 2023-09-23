import path from 'path';
import { mergeMap, from, toArray, concatMap, tap, map } from 'rxjs';

import { writeFileObs } from 'observable-fs';
import { toCsv } from '../../../../tools/csv/to-csv';

import { CONFIG } from '../../../../config';
import { reposCompactInFolderObs } from '../../../../git-functions/repo.functions';
import { ClocDiffStats } from '../../../../cloc-functions/cloc-diff.model';

import { clocDiffStatToCsvWithBase } from './cloc-diff-stat-csv';
import { calculateClocGitDiffsChildParent } from '../internals/commit-cloc-diff.function';

// calculateCodeTurnover is a function that calculates the cloc diffs on the repos contained in a folder
export function calculateCodeTurnover(
    folderPath: string,
    outdir: string,
    languages: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = CONFIG.CONCURRENCY,
    excludeRepoPaths: string[] = [],
) {
    return calculateClocDiffsOnRepos(folderPath, outdir, languages, fromDate, toDate, concurrency, excludeRepoPaths);
}

export function calculateClocDiffsOnRepos(
    folderPath: string,
    outdir: string,
    languages: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = CONFIG.CONCURRENCY,
    excludeRepoPaths: string[] = [],
) {
    const startTime = new Date().getTime();
    const folderName = path.basename(folderPath);

    let diffsCompleted = 0;
    let diffsRemaining = 0;
    let diffsErrored = 0;

    return reposCompactInFolderObs(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe(
        // for each reoo return a stream of commits
        mergeMap((repo) => {
            const commitWithRepoPath = repo.commits.map((commit) => {
                return { commit, repoPath: repo.path };
            });
            return from(commitWithRepoPath);
        }),
        toArray(),
        // sort the commits and store in diffsRemaining the number of commits for which we have to calculate the diffs
        concatMap((commitsWithRepo) => {
            diffsRemaining = commitsWithRepo.length;
            // sort commitsWithRepo by commit date ascending
            commitsWithRepo.sort((a, b) => {
                return a.commit.date.getTime() - b.commit.date.getTime();
            });
            return from(commitsWithRepo);
        }),
        mergeMap(({ commit, repoPath }) => {
            return calculateClocGitDiffsChildParent(commit, repoPath, languages).pipe(
                tap((stat) => {
                    if (stat.clocDiff.error) {
                        diffsErrored++;
                    } else {
                        diffsCompleted++;
                    }
                    diffsRemaining--;
                    console.log(`====>>>> commit diffs completed: ${diffsCompleted} `);
                    console.log(`====>>>> commit diffs remaining: ${diffsRemaining} `);
                    console.log(`====>>>> commit diffs errored: ${diffsErrored} `);
                }),
            );
        }, concurrency),
        toArray(),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.json`);
            return writeClocDiffJson(stats, outFile).pipe(
                tap(() => {
                    console.log(
                        `\n====>>>> commit diffs errors can be seen in: ${outFile} (look for error property)\n`,
                    );
                }),
                map(() => stats),
            );
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.csv`);
            return writeClocCsv(stats, outFile).pipe(map(() => stats));
        }),
        tap(() => {
            const endTime = new Date().getTime();
            console.log(`====>>>> Total time to calculate cloc diffs: ${(endTime - startTime) / 1000} seconds`);
        }),
    );
}

const writeClocDiffJson = (
    stats: {
        yearMonth: string;
        clocDiff: ClocDiffStats;
    }[],
    outFile: string,
) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)]).pipe(
        tap({
            next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
        }),
        map(() => stats),
    );
};

const writeClocCsv = (
    stats: {
        remoteOriginUrl: string;
        repoPath: string;
        yearMonth: string;
        mostRecentCommitDate: string;
        leastRecentCommitDate: string;
        clocDiff: ClocDiffStats;
    }[],
    outFile: string,
) => {
    return writeFileObs(outFile, statsToCsv(stats)).pipe(
        tap({
            next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
        }),
        map(() => stats),
    );
};

function statsToCsv(
    reposStats: {
        remoteOriginUrl: string;
        repoPath: string;
        yearMonth: string;
        mostRecentCommitDate: string;
        leastRecentCommitDate: string;
        clocDiff: ClocDiffStats;
    }[],
) {
    const csvRecs = reposStats
        .filter((stat) => !stat.clocDiff.error)
        .map((stat) => flattenClocDiffStat(stat))
        .flat();
    return toCsv(csvRecs);
}

function flattenClocDiffStat(stat: {
    remoteOriginUrl: string;
    repoPath: string;
    yearMonth: string;
    mostRecentCommitDate: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
}) {
    const remoteOriginUrl = stat.remoteOriginUrl;
    const repoPath = stat.repoPath;
    const yearMonth = stat.yearMonth;
    const clocDiffStat = stat.clocDiff;
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const mostRecentCommitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${clocDiffStat.mostRecentCommitSha}`;
    const base = {
        remoteOriginUrl,
        repoPath,
        yearMonth,
        leastRecentCommitDate: stat.leastRecentCommitDate,
        mostRecentCommitDate: stat.mostRecentCommitDate,
        leastRecentCommit: clocDiffStat.leastRecentCommitSha,
        mostRecentCommit: clocDiffStat.mostRecentCommitSha,
        mostRecentCommitUrl,
    };
    return clocDiffStatToCsvWithBase(
        clocDiffStat.diffs,
        base,
        repoPath,
        clocDiffStat.leastRecentCommitSha!,
        clocDiffStat.mostRecentCommitSha!,
    );
}
