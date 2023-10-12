"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const cloc_1 = require("./cloc");
const rxjs_1 = require("rxjs");
const cloc_2 = require("../../../cloc-functions/cloc");
describe(`clocSummaryAsStreamOfStrings$`, () => {
    it(`read the cloc summary and notifies each line containing stats for a language over a stream`, (done) => {
        const repo = 'git-repo-with-code';
        const clocParams = {
            folderPath: `./test-data/${repo}`,
            outDir: '',
            vcs: 'git',
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileCreatedSync = (0, cloc_2.writeClocSummary)(Object.assign(Object.assign({}, clocParams), { outDir: './temp/', outClocFilePrefix: 'same-process-' }), 'test');
        (0, cloc_1.clocSummaryAsStreamOfStrings$)(clocParams)
            .pipe((0, operators_1.toArray)(), (0, operators_1.concatMap)((linesReadFromStream) => (0, observable_fs_1.readLinesObs)(outFileCreatedSync).pipe((0, operators_1.map)((linesReadFromFilecreatedSync) => ({
            linesReadFromStream,
            linesReadFromFilecreatedSync,
        })))), (0, operators_1.tap)({
            next: ({ linesReadFromStream, linesReadFromFilecreatedSync }) => {
                // skip the first line of the file written synchronously since it contains the heade of cloc output
                const _linesReadFromFilecreatedSync = linesReadFromFilecreatedSync.slice(1);
                (0, chai_1.expect)(_linesReadFromFilecreatedSync.length).equal(linesReadFromStream.length);
                linesReadFromStream.forEach((line, i) => {
                    //  v 1.92  T=0.01 s (294.9 files/s, 1671.1 lines/s
                    //  v 1.92  T=0.01 s (283.7 files/s, 1607.7 lines/s)
                    const theOtherLine = _linesReadFromFilecreatedSync[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
            },
        }))
            .subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read the cloc summary and, while notifying over a streams, writes the summary in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const params = {
            folderPath: `./test-data/${repo}`,
            outDir: '',
            vcs: 'git',
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSynch = (0, cloc_2.writeClocSummary)(Object.assign(Object.assign({}, params), { outDir: './temp/', outClocFilePrefix: 'same-process' }), 'test');
        const clocSummaryFile = path_1.default.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);
        (0, cloc_1.clocSummaryAsStreamOfStrings$)(params, clocSummaryFile)
            .pipe((0, operators_1.toArray)(), (0, operators_1.concatMap)(() => (0, rxjs_1.forkJoin)([(0, observable_fs_1.readLinesObs)(outFileSynch), (0, observable_fs_1.readLinesObs)(clocSummaryFile)])), (0, operators_1.tap)({
            next: ([linesReadSync, linesReadFromFileWrittenInThisTest]) => {
                // skip the first line which contains statistical data which vary between the different executions
                // skip the last line which in one case is the empty string and in the other is null
                const _linesReadFromFileWrittenInThisTest = linesReadFromFileWrittenInThisTest.slice(1);
                // skip the first line which contains statistical data which vary between the different executions
                const _linesReadSync = linesReadSync.slice(1);
                _linesReadFromFileWrittenInThisTest.forEach((line, i) => {
                    //  v 1.92  T=0.01 s (294.9 files/s, 1671.1 lines/s
                    //  v 1.92  T=0.01 s (283.7 files/s, 1607.7 lines/s)
                    const theOtherLine = _linesReadSync[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
            },
        }))
            .subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=cloc.spec.js.map