import { expect } from 'chai';
import path from 'path';

import { concatMap, map, tap } from 'rxjs';
import { deleteDirObs, makeTempDirObs } from 'observable-fs';

import XLSX from 'xlsx';

import { addWorksheet, summaryWorkbook, writeWorkbook } from './summary-excel';

// test the addWorksheet function creating a workbook in a temp folder and adding a worksheet to it
describe(`addWorksheet and writeWorkbook`, () => {
    it(`creates a workbook, add a spreadsheet to it reading the data from a csv file, write the workbook to a temp directory,
    read the file written and checks that the data has been correctly written`, (done) => {
        const cvsFileName = 'a-git-repo-summary-cloc.csv';
        // there are 3 records in the csv file used for the test
        const numRecInCvs = 3;

        const csvFile = path.join(process.cwd(), 'test-data', 'csv', cvsFileName);
        const sheetName = 'cloc';
        const tempDirPrefix = 'test-';

        let _tempDir: string;

        const workbook = summaryWorkbook();
        expect(workbook).not.undefined;

        addWorksheet(workbook, sheetName, csvFile)
            .pipe(
                concatMap(() => makeTempDirObs(tempDirPrefix)),
                // write the workbook to the temp dir
                map((tempDir) => {
                    _tempDir = tempDir;
                    return writeWorkbook(workbook, tempDir, 'test');
                }),
                // check that the file name is not empty
                tap((fileName) => {
                    expect(fileName).not.undefined;
                    expect(fileName).not.null;
                    expect(fileName).not.empty;
                }),
                // read the file and check that the data has been correctly written
                tap((excelSummaryFile) => {
                    const summaryWorkbook = XLSX.readFile(excelSummaryFile);
                    const worksheet = summaryWorkbook.Sheets[sheetName];
                    expect(worksheet).not.undefined;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = XLSX.utils.sheet_to_json<any>(worksheet);
                    expect(data).not.undefined;
                    expect(data.length).eq(numRecInCvs);
                }),
                concatMap(() => deleteDirObs(_tempDir)),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});