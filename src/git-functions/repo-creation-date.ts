import { fromCsvArray } from "@enrico.piccinin/csv-tools";
import { readLinesObs } from "observable-fs";
import { map } from "rxjs";

type RepoCreationDateDict = {
    // the key is the url to the repo on the "origin" git server
    // the value is the date of creation of the repo
    [http_url_to_repo: string]: string;
};

/**
 * Creates a dictionary mapping repository URLs to their creation dates based on a CSV file.
 *
 * @param filePath The path to the CSV file. The csv file should contain at least one record and the records should have the fields 'http_url_to_repo' or 'ssh_url_to_repo' (which represent the repo key) and 'created_at' otherwise an error is raised.
 * @returns An Observable that emits a dictionary where each key is a repository URL and each value is the corresponding creation date.
 */
export function repoCreationDateDict$(filePath: string) {
    return readLinesObs(filePath).pipe(
        map(lines => {
            const csvRecs = fromCsvArray<any>(lines, ',')
            const repoCreationDateDict: RepoCreationDateDict = {};
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
            })
            if (Object.keys(repoCreationDateDict).length === 0) {
                throw new Error(`The csv file ${filePath} does not contain any record`);
            }
            if (!isCreatedAtDateFieldPresent) {
                throw new Error(`The csv file ${filePath} does not contain the fields 'created_at'`);
            }
            return repoCreationDateDict;
        })
    )
}