import path from "path";

import { concatMap, map, tap } from "rxjs";

import { writeFileObs } from "observable-fs";
import { toCsv } from "@enrico.piccinin/csv-tools";

import { CONFIG } from "../../../../config";
import { clocOnRepos } from "../../../../git-cloc-functions/repo-cloc.functions";
import { RepoClocLanguageStats } from "../../../../git-cloc-functions/repo-cloc.model";

// calculateClocOnRepos is a function that calculates the cloc on the repos contained in a folder
// and write the results as a json file and as a csv file
export function calculateClocOnRepos(folderPath: string, outdir: string, concurrency = CONFIG.CONCURRENCY) {
    const folderName = path.basename(folderPath);
    return clocOnRepos(folderPath, concurrency).pipe(
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc.json`);
            return writeClocJson(stats, outFile).pipe(
                map(() => stats)
            )
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc.csv`);
            return writeClocCsv(stats, outFile).pipe(
                map(() => stats)
            )
        }),
    )
}

const writeClocJson = (stats: RepoClocLanguageStats[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc stats JSON written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

const writeClocCsv = (stats: RepoClocLanguageStats[], outFile: string) => {
    return writeFileObs(outFile, statsToCsv(stats))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc stats csv written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

function statsToCsv(stats: RepoClocLanguageStats[]) {
    const csvRecs = stats.map((stat) => {
        const repoPath = stat.repoPath;
        const clocStats = stat.clocStats;
        return clocStats.map((clocStat) => {
            return { repoPath, ...clocStat };
        })
    }).flat();
    return toCsv(csvRecs);
}