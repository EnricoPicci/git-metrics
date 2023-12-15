"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoCreationDateDict$ = void 0;
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
/**
 * Creates a dictionary mapping repository URLs to their creation dates based on a CSV file.
 *
 * @param filePath The path to the CSV file. The csv file should contain at least one record and the records should have the fields 'http_url_to_repo' or 'ssh_url_to_repo' (which represent the repo key) and 'created_at' otherwise an error is raised.
 * @returns An Observable that emits a dictionary where each key is a repository URL and each value is the corresponding creation date.
 */
function repoCreationDateDict$(filePath) {
    return (0, observable_fs_1.readLinesObs)(filePath).pipe((0, rxjs_1.map)(lines => {
        const csvRecs = (0, csv_tools_1.fromCsvArray)(lines, ',');
        const repoCreationDateDict = {};
        let isCreatedAtDateFieldPresent = false;
        csvRecs.forEach(csvRec => {
            if (!csvRec.http_url_to_repo && !csvRec.ssh_url_to_repo) {
                throw new Error(`The csv record ${csvRec} in the file ${filePath} does not contain the field 'http_url_to_repo' or 'ssh_url_to_repo'`);
            }
            if (csvRec.http_url_to_repo) {
                repoCreationDateDict[csvRec.http_url_to_repo] = csvRec.created_at;
            }
            if (csvRec.ssh_url_to_repo) {
                repoCreationDateDict[csvRec.ssh_url_to_repo] = csvRec.created_at;
            }
            if (csvRec.created_at) {
                isCreatedAtDateFieldPresent = true;
            }
        });
        if (Object.keys(repoCreationDateDict).length === 0) {
            throw new Error(`The csv file ${filePath} does not contain any record`);
        }
        if (!isCreatedAtDateFieldPresent) {
            throw new Error(`The csv file ${filePath} does not contain the fields 'created_at'`);
        }
        return repoCreationDateDict;
    }));
}
exports.repoCreationDateDict$ = repoCreationDateDict$;
//# sourceMappingURL=repo-creation-date.js.map