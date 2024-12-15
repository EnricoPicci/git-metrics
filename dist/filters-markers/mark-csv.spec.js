"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const rxjs_1 = require("rxjs");
const mark_csv_1 = require("./mark-csv");
describe(`markCsv$`, () => {
    it(`marks the records that contain certain substrings in their "file" field`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv';
        const csvFilePath = path_1.default.join(process.cwd(), 'test-data', 'csv', csvFileName);
        // a function that returns true if the file field contains 'generated'
        const markValueFunction = (csvRec) => {
            return csvRec.file.includes('generated') ? 'true' : 'false';
        };
        const markFieldName = 'contains_generated';
        // read sync the file
        const csvFile = fs_1.default.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1; // we don't count the header
        (0, mark_csv_1.markCsv$)(csvFilePath, markValueFunction, markFieldName).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)(records => {
            // check that the number of records is the same
            (0, chai_1.expect)(records.length).equal(numOfRecords);
            // check that the records that have the file field containing 'generated' have the mark_field set to true 
            records.forEach(rec => {
                (0, chai_1.expect)(rec.contains_generated).equal(rec.file.includes('generated') ? 'true' : 'false');
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`markFilesWithKeywords$`, () => {
    it(`marks the records which have certain keywords in their file names`, (done) => {
        const csvFileName = 'a-cloc-diff-between-dates.csv';
        const csvFilePath = path_1.default.join(process.cwd(), 'test-data', 'csv', csvFileName);
        const searchFieldName = 'file';
        const markFieldName = 'contains_generated_or_metadata';
        const keywords = ['generated', 'metadata'];
        const counter = { count: 0 };
        // read sync the file
        const csvFile = fs_1.default.readFileSync(csvFilePath, 'utf8');
        const csvLines = csvFile.split('\n');
        const numOfRecords = csvLines.length - 1; // we don't count the header
        (0, mark_csv_1.markFilesWithKeywords$)(csvFilePath, searchFieldName, markFieldName, keywords, counter).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)(records => {
            // check that the number of records is the same
            (0, chai_1.expect)(records.length).equal(numOfRecords);
            // check that the counter is 2 since there are two records with the keywords in their file field
            (0, chai_1.expect)(counter.count).equal(2);
            // check that if a record has the word 'generated' or 'metadata' in its file field, the mark field is set to true
            records.forEach(rec => {
                (0, chai_1.expect)(rec.contains_generated_or_metadata).equal(rec.file.includes('generated') || rec.file.includes('metadata') ? 'true' : 'false');
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=mark-csv.spec.js.map