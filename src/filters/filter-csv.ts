import { fromCsvObs, toCsvObs } from "@enrico.piccinin/csv-tools";
import { appendFileObs, readLineObs } from "observable-fs";
import { concatMap, filter, last, map, tap } from "rxjs";

export function filterCsv$(csvFilePath: string, filterFunction: (csvRec: {[key: string]: string}) => boolean) {
  // Read the CSV file as an Observable emitting each row as an array of dictionaries
    return readLineObs(csvFilePath).pipe(
        fromCsvObs<{[key: string]: string}>(),
        filter(filterFunction),
    )
}

export function filterOutFilesWithKeywords$(csvFilePath: string, keywords: string[], counter: {count: number}) {
    return filterCsv$(csvFilePath, (csvRec) => {
        const resp = !keywords.some(keyword => csvRec.file.includes(keyword));
        if (!resp) {
            counter.count++;
        }
        return !keywords.some(keyword => csvRec.file.includes(keyword));
    });
}

export function writeAfterFilteringOutFilesWithKeywords$(csvFilePath: string, keywords: string[]) {
    const tinmestamp = new Date().toISOString();
    const outputFilePath = csvFilePath.replace('.csv', `-filtered-${tinmestamp}.csv`);
    const counter = {count: 0};
    return filterOutFilesWithKeywords$(csvFilePath, keywords, counter).pipe(
        toCsvObs(),
        concatMap(csvLine => {
            return appendFileObs(outputFilePath, csvLine + '\n');
        }),
        last(),
        tap(() => {
            console.log(`Filtered out ${counter.count} files with keywords "${keywords.join(', ')}"`);
        }),
        map(() => outputFilePath),
    )
}