import XLSX from 'xlsx';
import { DEFAUL_CONFIG } from '../0-config/config';
import { readLineObs } from 'observable-fs';
import { map, tap, toArray } from 'rxjs';
import path from 'path';

// returns a workbook read from the summary template file which contains the sheets with the graphs already created
export function summaryWorkbook() {
    const xlsFilePath = path.join(__dirname, '..', '..', DEFAUL_CONFIG.SUMMARY_WORKBOOK_TEMPLATE);
    return XLSX.readFile(xlsFilePath);
}

// adds a new worksheet to the workbook filled with the data contained in the csv file
export function addWorksheet(workbook: XLSX.WorkBook, sheetName: string, csvFile: string) {
    return readLineObs(csvFile).pipe(
        map((line) => line.split(DEFAUL_CONFIG.CSV_SEP)),
        toArray(),
        tap((data) => {
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }),
        map(() => sheetName),
    );
}

// writes a workbook to a file
export function writeWorkbook(workbook: XLSX.WorkBook, outDir: string, workbookFileName: string) {
    const fileName = path.join(outDir, `${workbookFileName}.xlsx`);
    XLSX.writeFile(workbook, fileName);
    console.log(`====>>>> Workbook written ${fileName}`);
    return fileName;
}
