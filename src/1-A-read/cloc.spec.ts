import { expect } from 'chai';
import path from 'path';
import { tap, concatMap, toArray, map } from 'rxjs/operators';
import { readLinesObs } from 'observable-fs';
import {
    buildClocOutfile,
    buildSummaryClocOutfile,
    createClocLog,
    createClocNewProcess,
    createMultiClocLogs,
    createSummaryClocLog,
    createSummaryClocNewProcess,
} from './cloc';
import { ConfigReadCloc, ConfigReadMultiCloc } from './read-params/read-params';

describe(`createClocLog`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-cloc.csv`);
        const returnedOutFilePath = createClocLog(config, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                expect(lines.length).equal(5);
                const _fileName = 'hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName)).split(',');
                expect(language).equal('Java');
                expect(filename).equal(`./${_fileName}`);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(1);
                expect(parseInt(code)).equal(5);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});

describe(`createClocNewProcess`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const returnedOutFilePath = createClocLog(config, 'test');

        const outFileNewProcess = buildClocOutfile({ ...config, outClocFilePrefix: 'new-process' });

        createClocNewProcess(config, outFileNewProcess, 'test')
            .pipe(
                toArray(),
                concatMap((linesReadInNewProcess) =>
                    readLinesObs(returnedOutFilePath).pipe(
                        map((linesReadFromFilecreatedSynchronously) => ({
                            linesReadInNewProcess,
                            linesReadFromFilecreatedSynchronously,
                        })),
                    ),
                ),
                tap({
                    next: ({ linesReadInNewProcess, linesReadFromFilecreatedSynchronously }) => {
                        // ignore the first line since contains statistical infor which may vary between the 2 executions
                        let _linesReadInNewProcess = linesReadInNewProcess.slice(1);
                        const _linesReadFromFilecreatedSynchronously = linesReadFromFilecreatedSynchronously.slice(1);
                        // the execution in a new process adds an empty line at the end of the file
                        _linesReadInNewProcess = _linesReadInNewProcess.slice(0, _linesReadInNewProcess.length - 1);

                        _linesReadInNewProcess.forEach((line, i) => {
                            const theOtherLine = _linesReadFromFilecreatedSynchronously[i];
                            expect(line).equal(theOtherLine);
                        });
                        expect(_linesReadInNewProcess.length).equal(_linesReadFromFilecreatedSynchronously.length);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`createSummaryClocNewProcess`, () => {
    it(`read the cloc summary and saves it in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSameProcess = createSummaryClocLog({ ...config, outClocFilePrefix: 'same-process' }, 'test');

        const outFileNewProcess = buildSummaryClocOutfile({ ...config, outClocFilePrefix: 'new-process' });

        createSummaryClocNewProcess(config, outFileNewProcess, 'test')
            .pipe(
                toArray(),
                concatMap((linesReadInNewProcess) =>
                    readLinesObs(outFileSameProcess).pipe(
                        map((linesReadFromFilecreatedSynchronously) => ({
                            linesReadInNewProcess,
                            linesReadFromFilecreatedSynchronously,
                        })),
                    ),
                ),
                tap({
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
                            expect(line).equal(theOtherLine);
                        });
                        expect(linesReadInNewProcess.length).equal(linesReadFromFilecreatedSynchronously.length + 1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`createMultiClocLogs`, () => {
    it(`runs the cloc commmand on 2 files and read the files produced as the result of the commands`, (done) => {
        const repo_1 = 'a-git-repo';
        const repo_2 = 'a-git-repo-with-one-lazy-author';
        const outDir = path.join(process.cwd(), './temp');
        const outClocFilePrefix = 'multi-cloc-';
        const config: ConfigReadMultiCloc = {
            repoFolderPaths: [`./test-data/${repo_1}`, `./test-data/${repo_2}`],
            outDir,
            outClocFilePrefix,
        };
        const expectedOutFilePath_1 = path.join(outDir, `${outClocFilePrefix}${repo_1}-cloc.csv`);
        const expectedOutFilePath_2 = path.join(outDir, `${outClocFilePrefix}${repo_2}-cloc.csv`);
        const clocFiles = createMultiClocLogs(config, 'a test');
        expect(clocFiles[0]).equal(expectedOutFilePath_1);
        expect(clocFiles[1]).equal(expectedOutFilePath_2);
        readLinesObs(clocFiles[0])
            .pipe(
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                        expect(lines.length).equal(5);
                        const _fileName = 'hallo.java';
                        const [language, filename, blank, comment, code] = lines
                            .find((l) => l.includes(_fileName))
                            .split(',');
                        expect(language).equal('Java');
                        expect(filename).equal(`./${_fileName}`);
                        expect(parseInt(blank)).equal(3);
                        expect(parseInt(comment)).equal(2);
                        expect(parseInt(code)).equal(5);
                    },
                }),
                concatMap(() => readLinesObs(clocFiles[1])),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // there are 3 lines: 1 for the only file and 1 for the csv header, which is the first, and one for the sum which is the last
                        expect(lines.length).equal(3);
                        const _fileName = 'fake.java';
                        const [language, filename, blank, comment, code] = lines
                            .find((l) => l.includes(_fileName))
                            .split(',');
                        expect(language).equal('Java');
                        expect(filename).equal(`./${_fileName}`);
                        expect(parseInt(blank)).equal(3);
                        expect(parseInt(comment)).equal(2);
                        expect(parseInt(code)).equal(5);
                    },
                }),
            )
            .subscribe({ error: (err) => done(err), complete: () => done() });
    }).timeout(20000);
});

describe(`createSummaryClocLog`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-summary-cloc.csv`);
        const returnedOutFilePath = createSummaryClocLog(config, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 4 lines: 2 for the 2 languages (java nd python) and 1 for the csv header, which is the first,
                // and one for the sum which is the last
                expect(lines.length).equal(4);
                const _language = 'Java';
                const [files, language, blank, comment, code] = lines.find((l) => l.includes(_language)).split(',');
                expect(language).equal('Java');
                expect(parseInt(files)).equal(2);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(3);
                expect(parseInt(code)).equal(10);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
