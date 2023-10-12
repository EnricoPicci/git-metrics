"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocOnRepos = void 0;
const rxjs_1 = require("rxjs");
const cloc_1 = require("../cloc-functions/cloc");
const config_1 = require("../config");
const repo_functions_1 = require("../git-functions/repo.functions");
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
function clocOnRepos(folderPath, concurrency = config_1.CONFIG.CONCURRENCY) {
    const total = {
        language: 'TOTAL',
        nFiles: 0,
        blank: 0,
        comment: 0,
        code: 0,
    };
    return (0, rxjs_1.from)((0, repo_functions_1.reposInFolder)(folderPath)).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return (0, cloc_1.clocSummaryOnGitRepo$)(repoPath).pipe((0, rxjs_1.map)((clocStats) => {
            const sumStats = clocStats.find((clocStat) => clocStat.language === 'SUM');
            if (!sumStats) {
                console.log(`!!!!!!!!! No SUM stats found for repo ${repoPath}, i.e. no files to count for cloc`);
            }
            // the total const has been initialized at the beginning of the function hence its properties are not undefined
            // nFiles blank and comment may be undefined since they are optional in ClocLangageStats
            // they are optional because we may want to delete them to reduce the size of the final output
            total.nFiles += sumStats ? sumStats.nFiles : 0;
            total.blank += sumStats ? sumStats.blank : 0;
            total.comment += sumStats ? sumStats.comment : 0;
            total.code += sumStats ? sumStats.code : 0;
            // remove the item with the key language 'SUM'
            clocStats = clocStats.filter((clocStat) => clocStat.language !== 'SUM');
            const repoStats = { repoPath, clocStats };
            return repoStats;
        }));
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.map)((repoStats) => {
        repoStats.push({ repoPath: folderPath, clocStats: [total] });
        return repoStats;
    }));
}
exports.clocOnRepos = clocOnRepos;
//# sourceMappingURL=repo-cloc.functions.js.map