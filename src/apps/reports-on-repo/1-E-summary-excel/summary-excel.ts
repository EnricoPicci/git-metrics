import XLSX from 'xlsx';
import { DEFAUL_CONFIG } from '../0-config/config';
import { readLineObs } from 'observable-fs';
import { catchError, map, of, tap, toArray } from 'rxjs';
import path from 'path';

// returns a new workbook to be used as a summary workbook containing all the worksheets
export function summaryWorkbook() {
    return XLSX.utils.book_new();;
}

// adds a new worksheet to the workbook filled with the data contained in the csv file
export function addWorksheet(workbook: XLSX.WorkBook, sheetName: string, csvFile: string) {
    return readLineObs(csvFile).pipe(
        map((line) => line.split(DEFAUL_CONFIG.CSV_SEP)),
        map((csvRec) => csvRec.map((field) => (isNaN(Number(field)) ? field : Number(field)))),
        toArray(),
        tap((data) => {
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }),
        map(() => sheetName),
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`====>>>> File ${csvFile} not found`);
                return of('');
            }
            throw err;
        }),
    );
}

// writes a workbook to a file
export function writeWorkbook(workbook: XLSX.WorkBook, outDir: string, workbookFileName: string) {
    const fileName = path.join(outDir, `${workbookFileName}.xlsx`);
    XLSX.writeFile(workbook, fileName);
    console.log(`====>>>> Workbook written ${fileName}`);
    return fileName;
}
