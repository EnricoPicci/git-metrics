"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichWithJiraData$ = void 0;
const rxjs_1 = require("rxjs");
const dict_from_csv_1 = require("../tools/dictionary-utils/dict-from-csv");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
/**
 * Reads a CSV file containing enriched diff commit data and a CSV file containing Jira data, and returns an Observable
 * that emits the enriched diff commit data further enriched with the Jira data.
 * @param diffCommitEnrichedCsvPath The path to the CSV file containing the enriched diff commit data.
 * @param jiraCsvPath The path to the CSV file containing the Jira data.
 * @returns An Observable that emits the enriched diff commit data further enriched with the Jira data.
 */
function enrichWithJiraData$(diffCommitEnrichedCsvPath, jiraCsvPath) {
    return (0, dict_from_csv_1.dictFromCsvFile$)(jiraCsvPath, 'key').pipe((0, rxjs_1.tap)(d => {
        console.log(`Read ${Object.keys(d).length} Jira issues`);
    }), (0, rxjs_1.concatMap)(jiraDict => {
        return (0, observable_fs_1.readLineObs)(diffCommitEnrichedCsvPath).pipe((0, csv_tools_1.fromCsvObs)(), (0, rxjs_1.map)(rec => {
            const jiraIssue = jiraDict[rec.key];
            return Object.assign(Object.assign({}, rec), jiraIssue);
        }));
    }));
}
exports.enrichWithJiraData$ = enrichWithJiraData$;
//# sourceMappingURL=cloc-diff-commit-enrich-csv.js.map