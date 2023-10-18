"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const cloc_dictionary_1 = require("./cloc-dictionary");
describe(`clocFileDict$`, () => {
    it(`create a cloc dictionary for the folder where this project is contained`, (done) => {
        const folderPath = './';
        (0, cloc_dictionary_1.clocFileDict$)(folderPath)
            .pipe((0, rxjs_1.tap)((dict) => {
            (0, chai_1.expect)(Object.keys(dict).length).gt(0);
            // read the dict entry of this file
            const thisFolderPathLegth = process.cwd().length;
            const thisFilePath = __filename.substring(thisFolderPathLegth + 1);
            const thisFileClocInfo = dict[thisFilePath];
            (0, chai_1.expect)(thisFileClocInfo.language).equal('TypeScript');
            (0, chai_1.expect)(thisFileClocInfo.file).equal(thisFilePath);
            (0, chai_1.expect)(thisFileClocInfo.blank).gt(0);
            (0, chai_1.expect)(thisFileClocInfo.comment).gt(0);
            (0, chai_1.expect)(thisFileClocInfo.code).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`throws since the folder does not exist`, () => {
        const folderPath = 'not-existing-path';
        (0, chai_1.expect)(() => (0, cloc_dictionary_1.clocFileDict$)(folderPath)).throw;
    });
});
describe(`clocFileDictFromClocLogFile$`, () => {
    it(`create a dictionary with the file path as key and the cloc info as value`, (done) => {
        const logName = 'git-repo-with-code-cloc.gitlog';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}`);
        (0, cloc_dictionary_1.clocFileDictFromClocLogFile$)(logFilePath)
            .pipe((0, rxjs_1.tap)((dict) => {
            (0, chai_1.expect)(Object.keys(dict).length).equal(3);
            const _fileName = 'hallo.java';
            (0, chai_1.expect)(dict[_fileName].language).equal('Java');
            (0, chai_1.expect)(dict[_fileName].file).equal(_fileName);
            (0, chai_1.expect)(dict[_fileName].blank).equal(3);
            (0, chai_1.expect)(dict[_fileName].comment).equal(1);
            (0, chai_1.expect)(dict[_fileName].code).equal(5);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`try to create a dictionary with a file wihch is not found`, (done) => {
        const logName = 'not-existing-log.gitlog';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}`);
        (0, cloc_dictionary_1.clocFileDictFromClocLogFile$)(logFilePath)
            .pipe((0, rxjs_1.tap)((dict) => {
            (0, chai_1.expect)(Object.keys(dict).length).equal(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=cloc-dictionary.spec.js.map