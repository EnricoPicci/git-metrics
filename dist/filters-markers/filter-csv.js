"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAfterFilteringOutFilesWithKeywords$ = exports.filterOutFilesWithKeywords$ = exports.filterCsv$ = void 0;
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
function filterCsv$(csvFilePath, filterFunction) {
    // Read the CSV file as an Observable emitting each row as an array of dictionaries
    return (0, observable_fs_1.readLineObs)(csvFilePath).pipe((0, csv_tools_1.fromCsvObs)(), (0, rxjs_1.filter)(filterFunction));
}
exports.filterCsv$ = filterCsv$;
function filterOutFilesWithKeywords$(csvFilePath, keywords, counter) {
    return filterCsv$(csvFilePath, (csvRec) => {
        const resp = !keywords.some(keyword => csvRec.file.includes(keyword));
        if (!resp) {
            counter.count++;
        }
        return !keywords.some(keyword => csvRec.file.includes(keyword));
    });
}
exports.filterOutFilesWithKeywords$ = filterOutFilesWithKeywords$;
function writeAfterFilteringOutFilesWithKeywords$(csvFilePath, keywords) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-filtered-${tinmestamp}.csv`);
    const counter = { count: 0 };
    return filterOutFilesWithKeywords$(csvFilePath, keywords, counter).pipe((0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)(csvLine => {
        return (0, observable_fs_1.appendFileObs)(outputFilePath, csvLine + '\n');
    }), (0, rxjs_1.last)(), (0, rxjs_1.tap)(() => {
        console.log(`Filtered out ${counter.count} files with keywords "${keywords.join(', ')}"`);
    }), (0, rxjs_1.map)(() => outputFilePath));
}
exports.writeAfterFilteringOutFilesWithKeywords$ = writeAfterFilteringOutFilesWithKeywords$;
//# sourceMappingURL=filter-csv.js.map