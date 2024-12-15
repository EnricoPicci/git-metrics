"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAfterAddingMarkFieldsForKeywords$ = exports.writeAfterMarkingFilesWithKeywords$ = exports.markFilesWithKeywords$ = exports.markCsv$ = void 0;
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
function markCsv$(csvFilePath, markValueFunction, markFieldName) {
    let counterForConsole = 0;
    return (0, observable_fs_1.readLineObs)(csvFilePath).pipe((0, csv_tools_1.fromCsvObs)(), (0, rxjs_1.map)(rec => {
        // every 1000 records, log the progress
        counterForConsole++;
        if (counterForConsole % 10000 === 0) {
            console.log(`Marked ${counterForConsole} records`);
        }
        const markValue = markValueFunction(rec);
        return Object.assign(Object.assign({}, rec), { [markFieldName]: markValue });
    }));
}
exports.markCsv$ = markCsv$;
function markFilesWithKeywords$(csvFilePath, searchFieldName, markFieldName, keywords, counter) {
    const markValueFunction = (csvRec) => {
        if (!csvRec[searchFieldName]) {
            throw new Error(`Field ${searchFieldName} not found in record ${JSON.stringify(csvRec)}`);
        }
        const shouldMark = keywords.some(keyword => csvRec[searchFieldName].includes(keyword));
        if (shouldMark) {
            counter.count++;
        }
        const markValue = shouldMark ? 'true' : 'false';
        return markValue;
    };
    return markCsv$(csvFilePath, markValueFunction, markFieldName);
}
exports.markFilesWithKeywords$ = markFilesWithKeywords$;
function writeAfterMarkingFilesWithKeywords$(csvFilePath, searchFieldName, markFieldName, keywords) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-marked-${tinmestamp}.csv`);
    const counter = { count: 0 };
    let countLinesWritten = 0;
    return markFilesWithKeywords$(csvFilePath, searchFieldName, markFieldName, keywords, counter).pipe((0, csv_tools_1.toCsvObs)(), (0, rxjs_1.mergeMap)(csvLine => {
        // every 1000 records, log the progress
        countLinesWritten++;
        if (countLinesWritten % 1000 === 0) {
            console.log(`${countLinesWritten} records written`);
        }
        return (0, observable_fs_1.appendFileObs)(outputFilePath, csvLine + '\n');
    }, 100), (0, rxjs_1.last)(), (0, rxjs_1.tap)(() => {
        console.log(`Marked ${counter.count} files with keywords "${keywords.join(', ')}" in field "${markFieldName}"`);
    }), (0, rxjs_1.map)(() => outputFilePath));
}
exports.writeAfterMarkingFilesWithKeywords$ = writeAfterMarkingFilesWithKeywords$;
function writeAfterAddingMarkFieldsForKeywords$(csvFilePath, markForKeywordsInstructions) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-marked-${tinmestamp}.csv`);
    const counter = { count: 0 };
    let countLinesWritten = 0;
    return (0, rxjs_1.from)(markForKeywordsInstructions).pipe((0, rxjs_1.concatMap)(markForKeywordsInstruction => {
        return markFilesWithKeywords$(csvFilePath, markForKeywordsInstruction.searchFieldName, markForKeywordsInstruction.markFieldName, markForKeywordsInstruction.keywords, counter).pipe((0, csv_tools_1.toCsvObs)(), (0, rxjs_1.mergeMap)(csvLine => {
            // every 1000 records, log the progress
            countLinesWritten++;
            if (countLinesWritten % 1000 === 0) {
                console.log(`${countLinesWritten} records written`);
            }
            return (0, observable_fs_1.appendFileObs)(outputFilePath, csvLine + '\n');
        }, 100));
    }));
}
exports.writeAfterAddingMarkFieldsForKeywords$ = writeAfterAddingMarkFieldsForKeywords$;
//# sourceMappingURL=mark-csv.js.map