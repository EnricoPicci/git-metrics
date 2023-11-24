import { concatMap, map, tap } from "rxjs";
import { dictFromCsvFile$ } from "../tools/dictionary-utils/dict-from-csv";
import { readLineObs } from "observable-fs";
import { fromCsvObs } from "@enrico.piccinin/csv-tools";

/**
 * Reads a CSV file containing enriched diff commit data and a CSV file containing Jira data, and returns an Observable 
 * that emits the enriched diff commit data further enriched with the Jira data.
 * @param diffCommitEnrichedCsvPath The path to the CSV file containing the enriched diff commit data.
 * @param jiraCsvPath The path to the CSV file containing the Jira data.
 * @returns An Observable that emits the enriched diff commit data further enriched with the Jira data.
 */
export function enrichWithJiraData$(diffCommitEnrichedCsvPath: string, jiraCsvPath: string) {
    return dictFromCsvFile$(jiraCsvPath, 'key').pipe(
        tap(d => {
            console.log(`Read ${Object.keys(d).length} Jira issues`)
        }),
        concatMap(jiraDict => {
            return readLineObs(diffCommitEnrichedCsvPath).pipe(
                fromCsvObs<any>(),
                map(rec => {
                    const jiraIssue = jiraDict[rec.key]
                    return { ...rec, ...jiraIssue }
                })
            )
        }),
    )
}
