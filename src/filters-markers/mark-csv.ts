import { fromCsvObs, toCsvObs } from "@enrico.piccinin/csv-tools";
import { appendFileObs, readLineObs } from "observable-fs";
import { concatMap, from, last, map, mergeMap, tap } from "rxjs";

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

export function markFilesWithKeywords$(
    csvFilePath: string, 
    searchFieldName: string,
    markFieldName: string,
    keywords: string[],  
    counter: {count: number}
) {
    const markValueFunction = (csvRec: {[key: string]: string}) => {
        if (!csvRec[searchFieldName]) {
            throw new Error(`Field ${searchFieldName} not found in record ${JSON.stringify(csvRec)}`);
        }
        const shouldMark = keywords.some(keyword => csvRec[searchFieldName].includes(keyword));
        if (shouldMark) {
            counter.count++;
        }
        const markValue = shouldMark ? 'true' : 'false';
        return markValue;
    }
    return markCsv$(csvFilePath, markValueFunction, markFieldName);
}

export function writeAfterMarkingFilesWithKeywords$(
    csvFilePath: string, 
    searchFieldName: string,
    markFieldName: string, 
    keywords: string[]
) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-marked-${tinmestamp}.csv`);
    const counter = {count: 0};
    let countLinesWritten = 0;
    return markFilesWithKeywords$(csvFilePath, searchFieldName, markFieldName, keywords, counter).pipe(
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

// structure to hold the instructions for marking
// - searchFieldName: the field to search for the keywords
// - markFieldName: the field to hold the value 'true' or 'false' if the keywords are found
// - keywords: the keywords to search for in the searchFieldName
export type MarkForKeywordsInstruction = {
    searchFieldName: string,
    markFieldName: string,
    keywords: string[],
}
export function writeAfterAddingMarkFieldsForKeywords$(
    csvFilePath: string, 
    markForKeywordsInstructions: MarkForKeywordsInstruction[]
) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-marked-${tinmestamp}.csv`);
    const counter = {count: 0};
    let countLinesWritten = 0;
    return from(markForKeywordsInstructions).pipe(
        concatMap(markForKeywordsInstruction => {
            return markFilesWithKeywords$(
                csvFilePath,  
                markForKeywordsInstruction.searchFieldName, 
                markForKeywordsInstruction.markFieldName, 
                markForKeywordsInstruction.keywords,
                counter
            ).pipe(
                toCsvObs(),
                mergeMap(csvLine => {
                    // every 1000 records, log the progress
                    countLinesWritten++;
                    if (countLinesWritten % 1000 === 0) {
                        console.log(`${countLinesWritten} records written`);
                    }
                    return appendFileObs(outputFilePath, csvLine + '\n');
                }, 100),  // appent to file cocurrently up to 100 lines in parallel
            )
        })
    )
}