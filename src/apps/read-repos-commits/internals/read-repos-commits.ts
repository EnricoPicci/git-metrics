import path from 'path';
import { concatMap, map, tap, toArray } from 'rxjs';

import { writeFileObs } from 'observable-fs';
import { toCsv } from '@enrico.piccinin/csv-tools';
import {
    reposCompactWithCommitsByMonthsInFolderObs,
    newReposWithCommitsByMonth,
    repoCommitsByMonthRecords,
} from '../../code-turnover/internals/repos-with-commits-by-month.functions';
import {
    RepoCompactWithCommitsByMonths,
    ReposWithCommitsByMonths,
} from '../../code-turnover/internals/repos-with-commits-by-month.model';

// readReposCommits reads all the repos contained in a directory and returns an observable of an array of RepoCompact
export function readReposCommits(
    folderPath: string,
    outdir: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = 1,
) {
    const folderName = path.basename(folderPath);

    return reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate, toDate, concurrency).pipe(
        toArray(),
        concatMap((repos) => {
            const outFile = path.join(outdir, `${folderName}.json`);
            return writeReposJson(repos, outFile);
        }),
        concatMap((repos) => {
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.json`);
            const repoCommitsByMonth = newReposWithCommitsByMonth(repos);
            return writeReposCommitsByMonthJson(repoCommitsByMonth, outFile);
        }),
        concatMap((repoCommitsByMonth) => {
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.csv`);
            return writeReposCommitsByMonthCsv(repoCommitsByMonth, outFile);
        }),
    );
}

const writeReposJson = (repos: RepoCompactWithCommitsByMonths[], outFile: string) => {
    return writeFileObs(outFile, [
        // add a replacer function since JSON.stringify does not support Set
        // https://stackoverflow.com/a/46491780/5699993
        JSON.stringify(repos, (_key, value) => (value instanceof Set ? [...value] : value), 2),
    ]).pipe(
        tap({
            next: () => console.log(`====>>>> Repos info written in file: ${outFile}`),
        }),
        map(() => repos),
    );
};

const writeReposCommitsByMonthJson = (repoCommitsByMonth: ReposWithCommitsByMonths, outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(repoCommitsByMonth, null, 2)]).pipe(
        tap({
            next: () => console.log(`====>>>> Repos commits by month info written in file: ${outFile}`),
        }),
        map(() => repoCommitsByMonth),
    );
};

const writeReposCommitsByMonthCsv = (repoCommitsByMonth: ReposWithCommitsByMonths, outFile: string) => {
    const repoCommitsByMonthRecs = repoCommitsByMonthRecords(repoCommitsByMonth);
    const repoCommitsByMonthCsvs = toCsv(repoCommitsByMonthRecs);

    return writeFileObs(outFile, repoCommitsByMonthCsvs).pipe(
        tap({
            next: () => console.log(`====>>>> Repos commits by month csv records written in file: ${outFile}`),
        }),
    );
};
