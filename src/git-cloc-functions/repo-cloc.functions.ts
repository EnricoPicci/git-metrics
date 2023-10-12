import { from, map, mergeMap, toArray } from "rxjs";

import { clocSummaryOnGitRepo$ } from "../cloc-functions/cloc";
import { CONFIG } from "../config";
import { ClocLanguageStats } from "../cloc-functions/cloc.model";
import { reposInFolder } from "../git-functions/repo.functions";

import { RepoClocLanguageStats } from "./repo-cloc.model";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


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
                        console.log(`!!!!!!!!! No SUM stats found for repo ${repoPath}, i.e. no files to count for cloc`)
                    }
                    // the total const has been initialized at the beginning of the function hence its properties are not undefined
                    // nFiles blank and comment may be undefined since they are optional in ClocLangageStats
                    // they are optional because we may want to delete them to reduce the size of the final output
                    total.nFiles! += sumStats ? sumStats.nFiles! : 0
                    total.blank! += sumStats ? sumStats.blank! : 0
                    total.comment! += sumStats ? sumStats.comment! : 0
                    total.code += sumStats ? sumStats.code : 0
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