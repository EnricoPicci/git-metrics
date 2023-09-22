import { from, map, mergeMap, toArray } from "rxjs";

import { reposInFolder } from "../repos-functions/repos-in-folder";
import { runCloc } from "../cloc-functions/cloc.functions";
import { CONFIG } from "../config";
import { RepoClocLanguageStats } from "./repo-cloc.model";
import { ClocLanguageStats } from "../cloc-functions/cloc.model";

// clocOnRepos is a function that takes the path of a folder containing git repositories 
// and returns the cloc stats for each repository
export function clocOnRepos(folderPath: string, concurrency = CONFIG.CONCURRENCY) {
    const total: ClocLanguageStats = {
        language: 'TOTAL',
        nFiles: 0,
        blank: 0,
        comment: 0,
        code: 0,
    }
    return from(reposInFolder(folderPath)).pipe(
        mergeMap((repoPath) => {
            return runCloc(repoPath, 'git').pipe(
                map((clocStats) => {
                    const sumStats = clocStats.find((clocStat) => clocStat.language === 'SUM');
                    if (!sumStats) {
                        throw new Error(`No SUM stats found for repo ${repoPath}`)
                    }
                    total.nFiles += sumStats.nFiles
                    total.blank += sumStats.blank
                    total.comment += sumStats.comment
                    total.code += sumStats.code
                    // remove the item with the key language 'SUM'
                    clocStats = clocStats.filter((clocStat) => clocStat.language !== 'SUM');

                    const repoStats: RepoClocLanguageStats = { repoPath, clocStats }
                    return repoStats;
                })
            );
        }, concurrency),
        toArray(),
        map((repoStats) => {
            repoStats.push({ repoPath: folderPath, clocStats: [total] });
            return repoStats;
        })
    )
}