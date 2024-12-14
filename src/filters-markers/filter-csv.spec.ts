import { expect } from 'chai';
import path from 'path';
import fs from 'fs';
import { filterCsv$, filterOutFilesWithKeywords$ } from './filter-csv';
import { tap, toArray } from 'rxjs';
import { noneOfStringsPresent } from './none-of-strings-present';

describe(`filterCSV$`, () => {
    it(`filters the records that contain certain substrings in their "file" field`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv'
        const csvFilePath = path.join(process.cwd(), 'test-data', 'csv', csvFileName);

        const filterFunction = (csvRec: {[key: string]: string}) => {
            return !csvRec.file.includes('generated');
        }

        // read sync the file
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1;  // we don't count the header

        filterCsv$(csvFilePath, filterFunction).pipe(
            toArray(),
            tap(records => {
                // the filter function should have removed one record
                expect(records.length).equal(numOfRecords-1);
                // check that no records have the file field containing 'generated'
                records.forEach(rec => {
                    expect(rec.file).not.include('generated');
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        })
            
    });
    it(`filters the records using the noneOfStringsPresent function`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv'
        const csvFilePath = path.join(process.cwd(), 'test-data', 'csv', csvFileName);

        const stringsToCheck = ['generated', 'metadata'];
        const fieldName = 'file';

        const filterFunction = (csvRec: {[key: string]: string}) => {
            return noneOfStringsPresent(stringsToCheck, csvRec, fieldName);
        }

        // read sync the file
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1;  // we don't count the header

        filterCsv$(csvFilePath, filterFunction).pipe(
            toArray(),
            tap(records => {
                // the filter function should have removed two records
                expect(records.length).equal(numOfRecords-2);
                // check that no records have the file field containing 'generated'
                records.forEach(rec => {
                    expect(rec.file).not.include('generated');
                })
                // check that no records have the file field containing 'metadata'
                records.forEach(rec => {
                    expect(rec.file).not.include('metadata');
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        })
            
    });
});

describe(`filterOutFilesWithKeywords$`, () => {
    it(`filters the records which have certain keywords in their file names`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv'
        const csvFilePath = path.join(process.cwd(), 'test-data', 'csv', csvFileName);

        const keywords = ['generated', 'metadata'];

        const counter = {count: 0};

        // read sync the file
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1;  // we don't count the header

        filterOutFilesWithKeywords$(csvFilePath, keywords, counter).pipe(
            toArray(),
            tap(records => {
                // the filter function should have removed two records
                expect(records.length).equal(numOfRecords-2);
                expect(counter.count).equal(2);
                // check that no records have the file field containing 'generated'
                records.forEach(rec => {
                    expect(rec.file).not.include('generated');
                })
                // check that no records have the file field containing 'metadata'
                records.forEach(rec => {
                    expect(rec.file).not.include('metadata');
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        })
            
    });
});