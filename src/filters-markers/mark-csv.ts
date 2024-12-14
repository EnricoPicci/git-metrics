import { fromCsvObs, toCsvObs } from "@enrico.piccinin/csv-tools";
import { appendFileObs, readLineObs } from "observable-fs";
import { last, map, mergeMap, tap } from "rxjs";

export function markCsv$(
    csvFilePath: string, 
    markValueFunction: (csvRec: {[key: string]: string}) => string,
    markFieldName: string
) {
    let counterForConsole = 0;
    return readLineObs(csvFilePath).pipe(
        fromCsvObs<{[key: string]: string}>(),
        map(rec => {
            // every 1000 records, log the progress
            counterForConsole++;
            if (counterForConsole % 10000 === 0) {
                console.log(`Marked ${counterForConsole} records`);
            }
            const markValue = markValueFunction(rec);
            return {...rec, [markFieldName]: markValue};
        }),
    )
}

export function markFilesWithKeywords$(csvFilePath: string, keywords: string[], markFieldName: string, counter: {count: number}) {
    const markValueFunction = (csvRec: {[key: string]: string}) => {
        const shouldMark = keywords.some(keyword => csvRec.file.includes(keyword));
        if (shouldMark) {
            counter.count++;
        }
        const markValue = shouldMark ? 'true' : 'false';
        return markValue;
    }
    return markCsv$(csvFilePath, markValueFunction, markFieldName);
}

export function writeAfterMarkingOutFilesWithKeywords$(csvFilePath: string, keywords: string[], markFieldName: string) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-marked-${tinmestamp}.csv`);
    const counter = {count: 0};
    let countLinesWritten = 0;
    return markFilesWithKeywords$(csvFilePath, keywords, markFieldName, counter).pipe(
        toCsvObs(),
        mergeMap(csvLine => {
            // every 1000 records, log the progress
            countLinesWritten++;
            if (countLinesWritten % 1000 === 0) {
                console.log(`${countLinesWritten} records written`);
            }
            return appendFileObs(outputFilePath, csvLine + '\n');
        }, 100),
        last(),
        tap(() => {
            console.log(`Marked ${counter.count} files with keywords "${keywords.join(', ')}" in field "${markFieldName}"`);
        }),
        map(() => outputFilePath),
    )
}