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
const delete_file_1 = require("../../../tools/test-helpers/delete-file");
const rxjs_1 = require("rxjs");
describe(`createClocLog`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc-byfile.csv`);
        const returnedOutFilePath = (0, cloc_1.createClocLog)(config, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        (0, observable_fs_1.readLinesObs)(returnedOutFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = 'hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName)).split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(1);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`streamClocNewProcess`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const returnedOutFilePath = (0, cloc_1.createClocLog)(config, 'test');
        (0, cloc_1.streamClocNewProcess)(config, 'test 1 streamClocNewProcess')
            .pipe((0, operators_1.toArray)(), (0, operators_1.concatMap)((linesReadInNewProcess) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath).pipe((0, operators_1.map)((linesReadFromFilecreatedSynchronously) => ({
            linesReadInNewProcess,
            linesReadFromFilecreatedSynchronously,
        })))), (0, operators_1.tap)({
            next: ({ linesReadInNewProcess, linesReadFromFilecreatedSynchronously }) => {
                // ignore the first line since contains statistical info which may vary between the 2 executions
                // and filter empty lines just in case
                let _linesReadInNewProcess = linesReadInNewProcess.slice(1)
                    .filter(l => l.trim().length > 0);
                const _linesReadFromFilecreatedSynchronously = linesReadFromFilecreatedSynchronously.slice(1)
                    .filter(l => l.trim().length > 0);
                _linesReadInNewProcess.forEach((line, i) => {
                    const theOtherLine = _linesReadFromFilecreatedSynchronously[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
                (0, chai_1.expect)(_linesReadInNewProcess.length).equal(_linesReadFromFilecreatedSynchronously.length);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`createClocLogNewProcess`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - works in a new process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const outClocFilePrefix = 'new-process';
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
        };
        const expectedOutFilePath = outDir + '/' + outClocFilePrefix + repo + '-cloc-byfile.csv';
        let counter = 0;
        (0, delete_file_1.deleteFile)(expectedOutFilePath)
            .pipe((0, operators_1.concatMap)(() => (0, cloc_1.createClocLogNewProcess)(config, 'test')), (0, operators_1.tap)({
            next: (returnedOutFilePath) => {
                (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
                counter++;
            },
        }), (0, operators_1.concatMap)((returnedOutFilePath) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath)), (0, operators_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = 'hallo.java';
                const [language, filename, blank, comment, code] = lines
                    .find((l) => l.includes(_fileName))
                    .split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(1);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                (0, chai_1.expect)(counter).equal(1);
                done();
            },
        });
    }).timeout(200000);
});
describe(`createSummaryClocLog`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc-summary.csv`);
        const returnedOutFilePath = (0, cloc_1.createSummaryClocLog)(config, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        (0, observable_fs_1.readLinesObs)(returnedOutFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 4 lines: 2 for the 2 languages (java nd python) and 1 for the csv header, which is the first,
                // and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(4);
                const _language = 'Java';
                const [files, language, blank, comment, code] = lines.find((l) => l.includes(_language)).split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(parseInt(files)).equal(2);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(3);
                (0, chai_1.expect)(parseInt(code)).equal(10);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`streamSummaryClocNewProcess`, () => {
    it(`read the cloc summary and notifies each line containing stats for a language over a stream`, (done) => {
        const repo = 'git-repo-with-code';
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir: '', // outdir should not be mandatory since it is not used in this function    
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileCreatedSync = (0, cloc_1.createSummaryClocLog)(Object.assign(Object.assign({}, config), { outDir: './temp/', outClocFilePrefix: 'same-process-' }), 'test');
        (0, cloc_1.clocSummaryAsStreamOfStrings$)(config)
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
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir: '', // outdir should not be mandatory since it is not used in this function
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSynch = (0, cloc_1.createSummaryClocLog)(Object.assign(Object.assign({}, config), { outDir: './temp/', outClocFilePrefix: 'same-process' }), 'test');
        const clocSummaryFile = path_1.default.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);
        (0, cloc_1.clocSummaryAsStreamOfStrings$)(config, clocSummaryFile)
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
    it(`tries to read a cloc summary file that does not exist and returns an empty array`, (done) => {
        (0, cloc_1.clocSummaryInfo)('not-existing-file').subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).empty;
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`createSummaryClocNewProcess`, () => {
    it(`read the cloc summary and saves it in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const outClocFilePrefix = 'new-process';
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSameProcess = (0, cloc_1.createSummaryClocLog)(Object.assign(Object.assign({}, config), { outDir: './temp/', outClocFilePrefix: 'same-process' }), 'test');
        const expectedOutFilePath = (0, cloc_1.buildSummaryClocOutfile)(config);
        let counter = 0;
        (0, delete_file_1.deleteFile)(expectedOutFilePath)
            .pipe((0, operators_1.concatMap)(() => (0, cloc_1.createSummaryClocNewProcess)(config, 'test')), (0, operators_1.tap)({
            next: (outFile) => {
                (0, chai_1.expect)(outFile).equal(expectedOutFilePath);
                counter++;
            },
        }), (0, operators_1.concatMap)((returnedOutFilePath) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath)), (0, operators_1.concatMap)((linesReadInNewProcess) => (0, observable_fs_1.readLinesObs)(outFileSameProcess).pipe((0, operators_1.map)((linesReadFromFilecreatedSynchronously) => ({
            linesReadInNewProcess,
            linesReadFromFilecreatedSynchronously,
        })))), (0, operators_1.tap)({
            next: ({ linesReadInNewProcess, linesReadFromFilecreatedSynchronously }) => {
                // skip the first line which contains statistical data which vary between the different executions
                // skip the last line which in one case is the empty string and in the other is null
                const _linesReadInNewProcess = linesReadInNewProcess.slice(1, linesReadInNewProcess.length - 1);
                // skip the first line which contains statistical data which vary between the different executions
                const _linesReadFromFilecreatedSynchronously = linesReadFromFilecreatedSynchronously.slice(1);
                _linesReadInNewProcess.forEach((line, i) => {
                    //  v 1.92  T=0.01 s (294.9 files/s, 1671.1 lines/s
                    //  v 1.92  T=0.01 s (283.7 files/s, 1607.7 lines/s)
                    const theOtherLine = _linesReadFromFilecreatedSynchronously[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
                (0, chai_1.expect)(linesReadInNewProcess.length).equal(linesReadFromFilecreatedSynchronously.length);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                (0, chai_1.expect)(counter).equal(1);
                done();
            },
        });
    }).timeout(200000);
});
//# sourceMappingURL=cloc.spec.js.map