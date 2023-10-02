import { from, map, mergeMap, toArray } from "rxjs";

import { clocSummaryOnGitRepo$ } from "../cloc-functions/cloc.functions";
import { CONFIG } from "../config";
import { RepoClocLanguageStats } from "./repo-cloc.model";
import { ClocLanguageStats } from "../cloc-functions/cloc.model";
import { reposInFolder } from "../git-functions/repo.functions";

/**
 * Takes a folder path and returns an Observable that emits a stream of `RepoClocLanguageStats` objects 
 * representing the cloc stats for each repository in the folder.
 * @param folderPath The path of the folder containing the git repositories.
 * @param concurrency The number of concurrent processes to run. Default is 10.
 * @returns An Observable that emits a stream of `RepoClocLanguageStats` objects representing the 
 * cloc stats for each repository in the folder.
 */
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
            return clocSummaryOnGitRepo$(repoPath).pipe(
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