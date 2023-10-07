import path from "path";
import { Observable, UnaryFunction, concatMap, map, mergeMap, of, toArray } from "rxjs";

import { CONFIG } from "../../../config";
import { reposCompactInFolderObs } from "../../../git-functions/repo.functions";

import { runReportsParallelReads } from "../../reports-on-repo/2-pipelines/internals/run-reports-on-repo-core";
import { calculateClocDiffs, writeClocDiffsCsv, writeClocDiffsJson } from "../../code-turnover/core/code-turnover.functions";
import { CommitDiffStats } from "../../code-turnover/core/code-turnover.model";

import { CommitDiffStatsWithSummaryReport } from "./code-turnover-and-reports.model";
import { languageExtensions } from "./language-extensions-dict";

/**
 * Generates the reports for a folder containing multiple Git repositories and calculates the code turnover for all repos
 * contained in the folder.
 * The function returns an Observable that emits an array of `CommitDiffStatsWithSummaryReport` 
 * objects representing the cloc diffs and summary reports for each commit in each repository.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param fromDate The start date for the cloc diffs and reports.
 * @param toDate The end date for the cloc diffs and reports.
 * @param outdir The path to the folder where the output should be saved.
 * @param languages An array of languages for which to calculate the cloc diffs.
 * @param concurrency The maximum number of concurrent child processes to run. Defaults to the value of `CONFIG.CONCURRENCY`.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation.
 * @param reports An array of report types to generate.
 * @param filter An array of file filters to apply to the reports.
 * @param outFilePrefix A prefix to add to the output file names.
 * @param clocDefsPath The path to the cloc definitions file.
 * @param concurrentReadOfCommits Whether to read the commits concurrently.
 * @param noRenames Whether to ignore file renames.
 * @param ignoreClocZero Whether to ignore files with zero lines of code.
 * @returns An Observable that emits an array of `CommitDiffStatsWithSummaryReport` objects representing the cloc diffs and summary reports for each commit in each repository.
 */
export function reportsAndCodeTurnover(
    folderPath: string,
    fromDate: Date,
    toDate: Date,
    outdir: string,
    languages: string[],
    concurrency = CONFIG.CONCURRENCY,
    excludeRepoPaths: string[] = [],
    reports: string[],
    outFilePrefix: string,
    clocDefsPath: string,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
    ignoreClocZero: boolean,
    removeBlanks: boolean,
    removeNFiles: boolean,
    removeComment: boolean,
    removeSame: boolean,
) {
    const folderName = path.basename(folderPath);

    const filter = languageExtensions(languages)

    return reposCompactInFolderObs(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe(
        mergeMap((repo) => {
            return runReportsParallelReads(
                reports,
                repo.path,
                filter,
                fromDate,
                toDate,
                outdir,
                outFilePrefix,
                clocDefsPath,
                concurrentReadOfCommits,
                noRenames,
                ignoreClocZero,
                0,
            ).pipe(
                map((reports) => {
                    return {
                        repo,
                        summaryReportPath: reports.summaryReportPath,
                    }
                })
            )
        }, 1),
        // comment the following code to avoid returning the summary report path to reduce the size of the output
        // concatMap(({ repo, summaryReportPath }) => {
        concatMap(({ repo }) => {
            return of(repo).pipe(
                calculateClocDiffs(languages, concurrency, removeBlanks, removeNFiles, removeComment, removeSame),
                map((clocDiffStat) => {
                    // return { ...clocDiffStat, summaryReportPath }
                    return clocDiffStat
                })
            )
        }),
        toArray(),
        map(stats => {
            return stats.flat()
        }),
        writeClocDiffsJson(outdir, folderName),
        writeClocDiffsCsv(outdir, folderName) as UnaryFunction<Observable<CommitDiffStats[]>, Observable<CommitDiffStatsWithSummaryReport[]>>,
    )
}