"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const filter_csv_1 = require("./filter-csv");
const rxjs_1 = require("rxjs");
const none_of_strings_present_1 = require("./none-of-strings-present");
describe(`filterCSV$`, () => {
    it(`filters the records that contain certain substrings in their "file" field`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv';
        const csvFilePath = path_1.default.join(process.cwd(), 'test-data', 'csv', csvFileName);
        const filterFunction = (csvRec) => {
            return !csvRec.file.includes('generated');
        };
        // read sync the file
        const csvFile = fs_1.default.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1; // we don't count the header
        (0, filter_csv_1.filterCsv$)(csvFilePath, filterFunction).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)(records => {
            // the filter function should have removed one record
            (0, chai_1.expect)(records.length).equal(numOfRecords - 1);
            // check that no records have the file field containing 'generated'
            records.forEach(rec => {
                (0, chai_1.expect)(rec.file).not.include('generated');
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`filters the records using the noneOfStringsPresent function`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv';
        const csvFilePath = path_1.default.join(process.cwd(), 'test-data', 'csv', csvFileName);
        const stringsToCheck = ['generated', 'metadata'];
        const fieldName = 'file';
        const filterFunction = (csvRec) => {
            return (0, none_of_strings_present_1.noneOfStringsPresent)(stringsToCheck, csvRec, fieldName);
        };
        // read sync the file
        const csvFile = fs_1.default.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1; // we don't count the header
        (0, filter_csv_1.filterCsv$)(csvFilePath, filterFunction).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)(records => {
            // the filter function should have removed two records
            (0, chai_1.expect)(records.length).equal(numOfRecords - 2);
            // check that no records have the file field containing 'generated'
            records.forEach(rec => {
                (0, chai_1.expect)(rec.file).not.include('generated');
            });
            // check that no records have the file field containing 'metadata'
            records.forEach(rec => {
                (0, chai_1.expect)(rec.file).not.include('metadata');
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`filterOutFilesWithKeywords$`, () => {
    it(`filters the records which have certain keywords in their file names`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv';
        const csvFilePath = path_1.default.join(process.cwd(), 'test-data', 'csv', csvFileName);
        const keywords = ['generated', 'metadata'];
        const counter = { count: 0 };
        // read sync the file
        const csvFile = fs_1.default.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1; // we don't count the header
        (0, filter_csv_1.filterOutFilesWithKeywords$)(csvFilePath, keywords, counter).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)(records => {
            // the filter function should have removed two records
            (0, chai_1.expect)(records.length).equal(numOfRecords - 2);
            (0, chai_1.expect)(counter.count).equal(2);
            // check that no records have the file field containing 'generated'
            records.forEach(rec => {
                (0, chai_1.expect)(rec.file).not.include('generated');
            });
            // check that no records have the file field containing 'metadata'
            records.forEach(rec => {
                (0, chai_1.expect)(rec.file).not.include('metadata');
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=filter-csv.spec.js.map