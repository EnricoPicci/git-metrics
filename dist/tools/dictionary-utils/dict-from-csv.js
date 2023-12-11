"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictFromCsvFile$ = void 0;
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
/**
 * Reads a CSV file and returns an Observable that emits a dictionary object where the keys are the values from a
 * specified field and the values are the corresponding csv records built from each line of the csv file.
 * @param csvFilePath The path to the CSV file.
 * @param keyField The field to use as the keys in the resulting dictionary.
 * @returns An Observable that emits a dictionary object where the keys are the values from the specified field
 * and the values are the records built from the corresponding lines of the CSV file.
 */
function dictFromCsvFile$(csvFilePath, keyField) {
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
    return (0, observable_fs_1.readLineObs)(csvFilePath).pipe((0, csv_tools_1.fromCsvObs)(), (0, rxjs_1.filter)((rec) => rec[keyField].includes('IIAB')), (0, rxjs_1.reduce)((dict, line) => {
        dict[line[keyField]] = line;
        return dict;
    }, {}));
}
exports.dictFromCsvFile$ = dictFromCsvFile$;
//# sourceMappingURL=dict-from-csv.js.map