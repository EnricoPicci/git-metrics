import path from 'path';
import { concatMap, from, map, mergeMap, tap, toArray } from 'rxjs';

import { writeFileObs } from 'observable-fs';
import { toCsv } from '@enrico.piccinin/csv-tools';

import { CONFIG } from '../../../config';

import { commitsMonthlyPairsForRepos } from '../internals/commit-monthly-pair.functions';
import {
    reposCompactWithCommitsByMonthsInFolderObs,
    newReposWithCommitsByMonth,
    repoCommitsByMonthRecordsDict,
} from '../internals/repos-with-commits-by-month.functions';
import { calculateMonthlyClocGitDiffs } from '../internals/commit-cloc-diff.function';
import { RepoMonthlyClocDiffStats } from '../internals/commit-cloc-diff.model';
import { clocDiffStatToCsvWithBase } from './cloc-diff-stat-csv';

// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
export function calculateMonthlyClocDiffsOnRepos(
    folderPath: string,
    outdir: string,
    languages: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = CONFIG.CONCURRENCY,
) {
    const folderName = path.basename(folderPath);
    return reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate, toDate).pipe(
        toArray(),
        concatMap((repos) => {
            const reposCommits = newReposWithCommitsByMonth(repos);
            const reposCommitsDict = repoCommitsByMonthRecordsDict(reposCommits);
            const repoMonthlyCommitPairs = commitsMonthlyPairsForRepos(reposCommitsDict);
            return from(repoMonthlyCommitPairs);
        }),
        mergeMap((repoMonthlyClocDiffs) => {
            return calculateMonthlyClocGitDiffs(repoMonthlyClocDiffs, languages);
        }, concurrency),
        toArray(),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-monthly-cloc-diff.json`);
            return writeMonthlyClocDiffJson(stats, outFile).pipe(map(() => stats));
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-monthly-cloc-diff.csv`);
            return writeMonthlyClocCsv(stats, outFile).pipe(map(() => stats));
        }),
    );
}

const writeMonthlyClocDiffJson = (stats: RepoMonthlyClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)]).pipe(
        tap({
            next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
        }),
        map(() => stats),
    );
};

const writeMonthlyClocCsv = (stats: RepoMonthlyClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, monthlyStatsToCsv(stats)).pipe(
        tap({
            next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
        }),
        map(() => stats),
    );
};

function monthlyStatsToCsv(reposStats: RepoMonthlyClocDiffStats[]) {
    const csvRecs = reposStats.map((stats) => flattenMonthlyClocDiffStatsDict(stats)).flat();
    return toCsv(csvRecs);
}

export function flattenMonthlyClocDiffStatsDict(stats: RepoMonthlyClocDiffStats) {
    const repoPath = stats.repoPath;
    const clocDiffStats = stats.clocDiffStats;
    const clocDiffStatsList = Object.keys(clocDiffStats).map((yearMonth) => {
        return { yearMonth, ...clocDiffStats[yearMonth] };
    });
    const clocDiffStatsListFlat = clocDiffStatsList.map((clocDiffStat) => {
        const diffTypes = clocDiffStat.diffs;
        const clocDiffStatFlat = { ...clocDiffStat, ...diffTypes };
        delete (clocDiffStatFlat as any).diffs;
        return clocDiffStatFlat;
    });
    const clocDiffTypeStatsListFlat = clocDiffStatsListFlat.map((clocDiffStat) => {
        const base = {
            repoPath,
            yearMonth: clocDiffStat.yearMonth,
            lastCommitInMonth: clocDiffStat.mostRecentCommitSha,
            previousMonthCommit: clocDiffStat.leastRecentCommitSha,
        };
        return clocDiffStatToCsvWithBase(
            clocDiffStat,
            base,
            repoPath,
            clocDiffStat.leastRecentCommitSha!,
            clocDiffStat.mostRecentCommitSha!,
        );
    });

    return clocDiffTypeStatsListFlat.flat();
}
