import { expect } from 'chai';
import path from 'path';
import fs from 'fs';
import { tap, toArray } from 'rxjs';
import { markCsv$, markFilesWithKeywords$ } from './mark-csv';

describe(`markCsv$`, () => {
    it(`marks the records that contain certain substrings in their "file" field`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv'
        const csvFilePath = path.join(process.cwd(), 'test-data', 'csv', csvFileName);

        // a function that returns true if the file field contains 'generated'
        const markValueFunction = (csvRec: {[key: string]: string}) => {
            return csvRec.file.includes('generated') ? 'true' : 'false';
        }
        const markFieldName = 'contains_generated';

        // read sync the file
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1;  // we don't count the header

        markCsv$(csvFilePath, markValueFunction, markFieldName).pipe(
            toArray(),
            tap(records => {
                // check that the number of records is the same
                expect(records.length).equal(numOfRecords);
                // check that the records that have the file field containing 'generated' have the mark_field set to true 
                records.forEach(rec => {
                    expect(rec.contains_generated).equal(rec.file.includes('generated') ? 'true' : 'false');
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        })
            
    });
});

describe(`markFilesWithKeywords$`, () => {
    it(`marks the records which have certain keywords in their file names`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv'
        const csvFilePath = path.join(process.cwd(), 'test-data', 'csv', csvFileName);

        const searchFieldName = 'file';
        const markFieldName = 'contains_generated_or_metadata';
        const keywords = ['generated', 'metadata'];

        const counter = {count: 0};

        // read sync the file
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1;  // we don't count the header

        markFilesWithKeywords$(csvFilePath, searchFieldName, markFieldName, keywords, counter).pipe(
            toArray(),
            tap(records => {
                // check that the number of records is the same
                expect(records.length).equal(numOfRecords);
                // check that the counter is 2 since there are two records with the keywords in their file field
                expect(counter.count).equal(2);
                // check that if a record has the word 'generated' or 'metadata' in its file field, the mark field is set to true
                records.forEach(rec => {
                    expect(rec.contains_generated_or_metadata).equal(rec.file.includes('generated') || rec.file.includes('metadata') ? 'true' : 'false');
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        })
            
    });
});