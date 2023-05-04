"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeWorkbook = exports.addWorksheet = exports.summaryWorkbook = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const config_1 = require("../0-config/config");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const path_1 = __importDefault(require("path"));
// returns a workbook read from the summary template file which contains the sheets with the graphs already created
function summaryWorkbook() {
    return xlsx_1.default.readFile(config_1.DEFAUL_CONFIG.SUMMARY_WORKBOOK_TEMPLATE);
}
exports.summaryWorkbook = summaryWorkbook;
// adds a new worksheet to the workbook filled with the data contained in the csv file
function addWorksheet(workbook, sheetName, csvFile) {
    return (0, observable_fs_1.readLineObs)(csvFile).pipe((0, rxjs_1.map)((line) => line.split(',')), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((data) => {
        const worksheet = xlsx_1.default.utils.aoa_to_sheet(data);
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, sheetName);
    }), (0, rxjs_1.map)(() => sheetName));
}
exports.addWorksheet = addWorksheet;
// writes a workbook to a file
function writeWorkbook(workbook, outDir, workbookFileName) {
    const fileName = path_1.default.join(outDir, `${workbookFileName}.xlsx`);
    xlsx_1.default.writeFile(workbook, fileName);
    console.log(`====>>>> Workbook written ${fileName}`);
    return fileName;
}
exports.writeWorkbook = writeWorkbook;
//# sourceMappingURL=summary-excel.js.map