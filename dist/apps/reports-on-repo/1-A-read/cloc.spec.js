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
const delete_file_1 = require("../../../0-tools/test-helpers/delete-file");
describe(`createClocLog`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc.csv`);
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
        const outFileNewProcess = (0, cloc_1.buildClocOutfile)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'new-process' }));
        (0, cloc_1.streamClocNewProcess)(config, outFileNewProcess, 'test')
            .pipe((0, operators_1.toArray)(), (0, operators_1.concatMap)((linesReadInNewProcess) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath).pipe((0, operators_1.map)((linesReadFromFilecreatedSynchronously) => ({
            linesReadInNewProcess,
            linesReadFromFilecreatedSynchronously,
        })))), (0, operators_1.tap)({
            next: ({ linesReadInNewProcess, linesReadFromFilecreatedSynchronously }) => {
                // ignore the first line since contains statistical infor which may vary between the 2 executions
                let _linesReadInNewProcess = linesReadInNewProcess.slice(1);
                const _linesReadFromFilecreatedSynchronously = linesReadFromFilecreatedSynchronously.slice(1);
                // the execution in a new process adds an empty line at the end of the file
                _linesReadInNewProcess = _linesReadInNewProcess.slice(0, _linesReadInNewProcess.length - 1);
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
    it(`executes the cloc command and saves the result on a file using a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const returnedOutFilePath = (0, cloc_1.createClocLog)(config, 'test');
        const outFileNewProcess = (0, cloc_1.buildClocOutfile)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'new-process' }));
        let outFileNewProcessNotified;
        (0, cloc_1.streamClocNewProcess)(config, outFileNewProcess, 'test', true)
            .pipe((0, operators_1.tap)((fileWritteInNewProcess) => {
            outFileNewProcessNotified = fileWritteInNewProcess;
        }), (0, operators_1.concatMap)((fileWritteInNewProcess) => (0, observable_fs_1.readLinesObs)(fileWritteInNewProcess)), (0, operators_1.concatMap)((linesReadFromFileWrittenInNewProcess) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath).pipe((0, operators_1.map)((linesReadFromFileCreatedSynchronously) => ({
            linesReadFromFileWrittenInNewProcess,
            linesReadFromFileCreatedSynchronously,
        })))), (0, operators_1.tap)({
            next: ({ linesReadFromFileWrittenInNewProcess, linesReadFromFileCreatedSynchronously }) => {
                // ignore the first line since contains statistical infor which may vary between the 2 executions
                let _linesReadFromFileWrittenInNewProcess = linesReadFromFileWrittenInNewProcess.slice(1);
                const _linesReadFromFileCreatedSynchronously = linesReadFromFileCreatedSynchronously.slice(1);
                // the execution in a new process adds an empty line at the end of the file
                _linesReadFromFileWrittenInNewProcess = _linesReadFromFileWrittenInNewProcess.slice(0, _linesReadFromFileWrittenInNewProcess.length - 1);
                _linesReadFromFileWrittenInNewProcess.forEach((line, i) => {
                    const theOtherLine = _linesReadFromFileCreatedSynchronously[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
                (0, chai_1.expect)(_linesReadFromFileWrittenInNewProcess.length).equal(_linesReadFromFileCreatedSynchronously.length);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                // checks that the outFile has actually been emitted
                (0, chai_1.expect)(outFileNewProcessNotified).not.undefined;
                done();
            },
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
        const expectedOutFilePath = (0, cloc_1.buildClocOutfile)(config);
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
describe(`createMultiClocLogs`, () => {
    it(`runs the cloc commmand on 2 files and read the files produced as the result of the commands`, (done) => {
        const repo_1 = 'a-git-repo';
        const repo_2 = 'a-git-repo-with-one-lazy-author';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const outClocFilePrefix = 'multi-cloc-';
        const config = {
            repoFolderPaths: [`./test-data/${repo_1}`, `./test-data/${repo_2}`],
            outDir,
            outClocFilePrefix,
        };
        const expectedOutFilePath_1 = path_1.default.join(outDir, `${outClocFilePrefix}${repo_1}-cloc.csv`);
        const expectedOutFilePath_2 = path_1.default.join(outDir, `${outClocFilePrefix}${repo_2}-cloc.csv`);
        const clocFiles = (0, cloc_1.createMultiClocLogs)(config, 'a test');
        (0, chai_1.expect)(clocFiles[0]).equal(expectedOutFilePath_1);
        (0, chai_1.expect)(clocFiles[1]).equal(expectedOutFilePath_2);
        (0, observable_fs_1.readLinesObs)(clocFiles[0])
            .pipe((0, operators_1.tap)({
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
                (0, chai_1.expect)(parseInt(comment)).equal(2);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }), (0, operators_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(clocFiles[1])), (0, operators_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 3 lines: 1 for the only file and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(3);
                const _fileName = 'fake.java';
                const [language, filename, blank, comment, code] = lines
                    .find((l) => l.includes(_fileName))
                    .split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(2);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }))
            .subscribe({ error: (err) => done(err), complete: () => done() });
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
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-summary-cloc.csv`);
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
    it(`read the cloc summary and saves it in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSameProcess = (0, cloc_1.createSummaryClocLog)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'same-process' }), 'test');
        const outFileNewProcess = (0, cloc_1.buildSummaryClocOutfile)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'new-process' }));
        (0, cloc_1.streamSummaryClocNewProcess)(config, outFileNewProcess, 'test')
            .pipe((0, operators_1.toArray)(), (0, operators_1.concatMap)((linesReadInNewProcess) => (0, observable_fs_1.readLinesObs)(outFileSameProcess).pipe((0, operators_1.map)((linesReadFromFilecreatedSynchronously) => ({
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
                (0, chai_1.expect)(linesReadInNewProcess.length).equal(linesReadFromFilecreatedSynchronously.length + 1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`executes the cloc summary command and saves the result on a file using a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const returnedOutFilePath = (0, cloc_1.createSummaryClocLog)(config, 'test');
        const outFileNewProcess = (0, cloc_1.buildClocOutfile)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'new-process' }));
        let outFileNewProcessNotified;
        (0, cloc_1.streamSummaryClocNewProcess)(config, outFileNewProcess, 'test', true)
            .pipe((0, operators_1.tap)((fileWritteInNewProcess) => {
            outFileNewProcessNotified = fileWritteInNewProcess;
        }), (0, operators_1.concatMap)((fileWritteInNewProcess) => (0, observable_fs_1.readLinesObs)(fileWritteInNewProcess)), (0, operators_1.concatMap)((linesReadFromFileWrittenInNewProcess) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath).pipe((0, operators_1.map)((linesReadFromFileCreatedSynchronously) => ({
            linesReadFromFileWrittenInNewProcess,
            linesReadFromFileCreatedSynchronously,
        })))), (0, operators_1.tap)({
            next: ({ linesReadFromFileWrittenInNewProcess, linesReadFromFileCreatedSynchronously }) => {
                // ignore the first line since contains statistical infor which may vary between the 2 executions
                let _linesReadFromFileWrittenInNewProcess = linesReadFromFileWrittenInNewProcess.slice(1);
                const _linesReadFromFileCreatedSynchronously = linesReadFromFileCreatedSynchronously.slice(1);
                // the execution in a new process adds an empty line at the end of the file
                _linesReadFromFileWrittenInNewProcess = _linesReadFromFileWrittenInNewProcess.slice(0, _linesReadFromFileWrittenInNewProcess.length - 1);
                _linesReadFromFileWrittenInNewProcess.forEach((line, i) => {
                    const theOtherLine = _linesReadFromFileCreatedSynchronously[i];
                    (0, chai_1.expect)(line).equal(theOtherLine);
                });
                (0, chai_1.expect)(_linesReadFromFileWrittenInNewProcess.length).equal(_linesReadFromFileCreatedSynchronously.length);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                // checks that the outFile has actually been emitted
                (0, chai_1.expect)(outFileNewProcessNotified).not.undefined;
                done();
            },
        });
    }).timeout(200000);
    it(`tries to read a cloc summary file that does not exist and returns an empty array`, (done) => {
        (0, cloc_1.clocSummaryStream)('not-existing-file').subscribe({
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
        const outFileSameProcess = (0, cloc_1.createSummaryClocLog)(Object.assign(Object.assign({}, config), { outClocFilePrefix: 'same-process' }), 'test');
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