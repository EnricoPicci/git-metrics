"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocOnRepos = void 0;
const rxjs_1 = require("rxjs");
const cloc_functions_1 = require("../cloc-functions/cloc.functions");
const config_1 = require("../config");
const repo_functions_1 = require("../git-functions/repo.functions");
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
        return (0, cloc_functions_1.clocSummaryOnGitRepo$)(repoPath).pipe((0, rxjs_1.map)((clocStats) => {
            const sumStats = clocStats.find((clocStat) => clocStat.language === 'SUM');
            if (!sumStats) {
                throw new Error(`No SUM stats found for repo ${repoPath}`);
            }
            total.nFiles += sumStats.nFiles;
            total.blank += sumStats.blank;
            total.comment += sumStats.comment;
            total.code += sumStats.code;
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