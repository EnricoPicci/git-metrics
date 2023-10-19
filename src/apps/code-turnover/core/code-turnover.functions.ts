import path from 'path';
import { mergeMap, from, toArray, concatMap, tap, map, pipe } from 'rxjs';

import { writeFileObs } from 'observable-fs';

import { toCsv } from '../../../tools/csv/to-csv';
import { reposCompactInFolder$ } from '../../../git-functions/repo';
import { RepoCompact } from '../../../git-functions/repo.model';
import { ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';

import { CalculateClocGitDiffsChildParentOptions, calculateClocGitDiffsChildParent } from '../internals/commit-cloc-diff.function';
import { CommitDiffStats } from './code-turnover.model';
import { clocDiffStatToCsvWithBase } from './cloc-diff-stat-csv';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Calculates the code turnover for a folder containing multiple Git repositories.
 * The function returns an Observable that, after having run the calculation, emits an array containing all the 
 * cloc diffs for each commit in each repository.
 * The result is also written in a JSON file and a CSV file in the given output folder.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param outdir The path to the folder where the output should be saved.
 * @param languages An array of languages for which to calculate the cloc diffs.
 * @param fromDate The start date for the cloc diffs. Defaults to the epoch (i.e. 01/01/1970).
 * @param toDate The end date for the cloc diffs. Defaults to the current date and time.
 * @param concurrency The maximum number of concurrent child processes to run. Defaults to the value of `CONFIG.CONCURRENCY`.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation.
 * @returns An Observable that emits the cloc diffs for each commit in each repository.
 */
export function calculateCodeTurnover(
    folderPath: string,
    outdir: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency: number,
    excludeRepoPaths: string[],
    options: CalculateClocGitDiffsChildParentOptions,
) {
    const startTime = new Date().getTime();
    const folderName = path.basename(folderPath);

    return reposCompactInFolder$(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe(
        calculateClocDiffs(concurrency, options),
        writeClocDiffs(outdir, folderName),
        tap(() => {
            const endTime = new Date().getTime();
            console.log(`====>>>> Total time to calculate cloc diffs: ${(endTime - startTime) / 1000} seconds`);
        }),
    );
}

/**
 * Returns a custom rxJs operator that takes a stream of RepoCompact objects and returns a stream of CommitDiffStats objects,
 * which represent the cloc diffs for each commit in the repository received from upstream for the given array of languages.
 * Diffs are calculated comparing the commit with its parent commit.
 * @param languages An array of languages for which to calculate the cloc diffs.
 * @param concurrency The maximum number of concurrent child processes to run. Defaults to the value of `CONFIG.CONCURRENCY`.
 * @returns An rxJs operator that transforms a stream of RepoCompact in a stream of CommitDiffStats.
 */
export function calculateClocDiffs(
    concurrency: number,
    options: CalculateClocGitDiffsChildParentOptions,
) {
    let diffsCompleted = 0;
    let diffsRemaining = 0;
    let diffsErrored = 0;

    return pipe(
        // return a stream of commits for the repo
        mergeMap((repo: RepoCompact) => {
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
            return calculateClocGitDiffsChildParent(commit, repoPath, options).pipe(
                tap((stat) => {
                    if (stat.clocDiff.error) {
                        diffsErrored++;
                    } else {
                        diffsCompleted++;
                    }
                    diffsRemaining--;
                    console.log(`====>>>> commit diffs completed: ${diffsCompleted} `);
                    const percentRemaining = diffsRemaining / (diffsCompleted + diffsRemaining) * 100;
                    // convert to number with 2 decimal digits
                    const percentRemaining2 = Math.round(percentRemaining * 100) / 100;
                    console.log(`====>>>> commit diffs remaining: ${diffsRemaining} - ${percentRemaining2}%`);
                    console.log(`====>>>> commit diffs errored: ${diffsErrored} `);
                }),
            );
        }, concurrency),
    )
}

export function writeClocDiffs(outdir: string, folderName: string) {
    return pipe(
        toArray<CommitDiffStats>(),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.json`);
            return writeClocDiffJson(stats, outFile).pipe(map(() => stats));
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.csv`);
            return writeClocCsv(stats, outFile).pipe(map(() => stats));
        }),
    )
}

export function writeClocDiffsJson(outdir: string, folderName: string) {
    return pipe(
        concatMap((stats: CommitDiffStats[]) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.json`);
            return writeClocDiffJson(stats, outFile).pipe(map(() => stats));
        }),
    )
}

export function writeClocDiffsCsv(outdir: string, folderName: string) {
    return pipe(
        concatMap((stats: CommitDiffStats[]) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.csv`);
            return writeClocCsv(stats, outFile).pipe(map(() => stats));
        }),
    )
}

export function statsToCsvRecs(
    reposStats: CommitDiffStats[],
) {
    const csvRecs = reposStats
        .filter((stat) => !stat.clocDiff.error)
        .map((stat) => flattenClocDiffStat(stat))
        .flat();
    return csvRecs;
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export const writeClocDiffJson = (
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
    stats: CommitDiffStats[],
    outFile: string,
) => {
    const csvRecs = statsToCsvRecs(stats)
    return writeFileObs(outFile, toCsv(csvRecs)).pipe(
        tap({
            next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
        }),
        map(() => stats),
    );
};

export function flattenClocDiffStat(stat: CommitDiffStats) {
    const clocDiffStat = stat.clocDiff;
    let base: any = stat
    delete base.clocDiff

    const remoteOriginUrl = stat.remoteOriginUrl;
    const remoteOriginUrlWithuotFinalDotGit = remoteOriginUrl.endsWith('.git')
        ? remoteOriginUrl.slice(0, -4)
        : remoteOriginUrl;
    const mostRecentCommitUrl = `${remoteOriginUrlWithuotFinalDotGit}/-/commit/${clocDiffStat.mostRecentCommitSha}`;
    const mostRecentCommitSha = clocDiffStat.mostRecentCommitSha;

    base = { ...base, remoteOriginUrl, mostRecentCommitUrl, mostRecentCommitSha }

    return clocDiffStatToCsvWithBase(
        clocDiffStat.diffs,
        base
    );
}
