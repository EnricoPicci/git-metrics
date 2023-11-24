import { fromCsvObs } from "@enrico.piccinin/csv-tools"
import { readLineObs } from "observable-fs"
import { filter, reduce } from "rxjs"

/**
 * Reads a CSV file and returns an Observable that emits a dictionary object where the keys are the values from a 
 * specified field and the values are the corresponding csv records built from each line of the csv file.
 * @param csvFilePath The path to the CSV file.
 * @param keyField The field to use as the keys in the resulting dictionary.
 * @returns An Observable that emits a dictionary object where the keys are the values from the specified field 
 * and the values are the records built from the corresponding lines of the CSV file.
 */
export function dictFromCsvFile$(csvFilePath: string, keyField: string) {
    // return readLinesObs(csvFilePath).pipe(
    //     map(lines => fromCsv<any>(lines[0], lines.slice(1))),
    //     map(csvs => {
    //         const dict = {} as { [key: string]: any }
    //         for (const csv of csvs.slice(0, 100000)) {
    //             dict[csv[keyField]] = csv
    //         }
    //         return dict
    //     })
    // )
    return readLineObs(csvFilePath).pipe(
        fromCsvObs<any>(),
        filter((rec) => rec[keyField].includes('IIAB')),
        reduce((dict, line) => {
            dict[line[keyField]] = line
            return dict
        }, {} as { [key: string]: any }),
    )
}