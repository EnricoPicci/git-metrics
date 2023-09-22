"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const xlsx_1 = __importDefault(require("xlsx"));
const summary_excel_1 = require("./summary-excel");
// test the addWorksheet function creating a workbook in a temp folder and adding a worksheet to it
describe(`addWorksheet and writeWorkbook`, () => {
    it(`creates a workbook, add a spreadsheet to it reading the data from a csv file, write the workbook to a temp directory,
    read the file wirtte and checks that the data has been correctly written`, (done) => {
        const cvsFileName = 'a-git-repo-summary-cloc.csv';
        // there are 3 records in the csv file used for the test
        const numRecInCvs = 3;
        const csvFile = path_1.default.join(process.cwd(), 'test-data', 'csv', cvsFileName);
        const sheetName = 'cloc';
        const tempDirPrefix = 'test-';
        let _tempDir;
        const workbook = (0, summary_excel_1.summaryWorkbook)();
        (0, chai_1.expect)(workbook).not.undefined;
        (0, summary_excel_1.addWorksheet)(workbook, sheetName, csvFile)
            .pipe((0, rxjs_1.concatMap)(() => (0, observable_fs_1.makeTempDirObs)(tempDirPrefix)), 
        // write the workbook to the temp dir
        (0, rxjs_1.map)((tempDir) => {
            _tempDir = tempDir;
            return (0, summary_excel_1.writeWorkbook)(workbook, tempDir, 'test');
        }), 
        // check that the file name is not empty
        (0, rxjs_1.tap)((fileName) => {
            (0, chai_1.expect)(fileName).not.undefined;
            (0, chai_1.expect)(fileName).not.null;
            (0, chai_1.expect)(fileName).not.empty;
        }), 
        // read the file and check that the data has been correctly written
        (0, rxjs_1.tap)((excelSummaryFile) => {
            const summaryWorkbook = xlsx_1.default.readFile(excelSummaryFile);
            const worksheet = summaryWorkbook.Sheets[sheetName];
            (0, chai_1.expect)(worksheet).not.undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = xlsx_1.default.utils.sheet_to_json(worksheet);
            (0, chai_1.expect)(data).not.undefined;
            (0, chai_1.expect)(data.length).eq(numRecInCvs);
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.deleteDirObs)(_tempDir)))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=summary-excel.spec.js.map