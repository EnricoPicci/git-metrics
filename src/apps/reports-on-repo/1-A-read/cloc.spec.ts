import { expect } from 'chai';
import path from 'path';
import { tap, concatMap, toArray, map } from 'rxjs/operators';
import { readLinesObs } from 'observable-fs';
import {
    buildSummaryClocOutfile,
    createClocLog,
    streamClocNewProcess,
    createSummaryClocLog,
    clocSummaryAsStreamOfStrings$,
    createClocLogNewProcess,
    createSummaryClocNewProcess,
    clocSummaryInfo,
} from './cloc';
import { ConfigReadCloc } from './read-params/read-params';
import { deleteFile } from '../../../tools/test-helpers/delete-file';
import { forkJoin } from 'rxjs';

describe(`createClocLog`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-cloc-byfile.csv`);
        const returnedOutFilePath = createClocLog(config, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                expect(lines.length).equal(5);
                const _fileName = './hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName))!.split(',');
                expect(language).equal('Java');
                expect(filename).equal(`${_fileName}`);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(1);
                expect(parseInt(code)).equal(5);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});

describe(`streamClocNewProcess`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        // executes the cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const returnedOutFilePath = createClocLog(config, 'test');

        streamClocNewProcess(config, 'test 1 streamClocNewProcess')
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
                        // ignore the first line since contains statistical info which may vary between the 2 executions
                        // and filter empty lines just in case
                        let _linesReadInNewProcess = linesReadInNewProcess.slice(1)
                            .filter(l => l.trim().length > 0);
                        const _linesReadFromFilecreatedSynchronously = linesReadFromFilecreatedSynchronously.slice(1)
                            .filter(l => l.trim().length > 0);

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
    }).timeout(200000);
});

describe(`createClocLogNewProcess`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - works in a new process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');

        const outClocFilePrefix = 'new-process';
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
        };

        const expectedOutFilePath = outDir + '/' + outClocFilePrefix + repo + '-cloc-byfile.csv';

        let counter = 0;

        deleteFile(expectedOutFilePath)
            .pipe(
                concatMap(() => createClocLogNewProcess(config, 'test')),
                tap({
                    next: (returnedOutFilePath) => {
                        expect(returnedOutFilePath).equal(expectedOutFilePath);
                        counter++;
                    },
                }),
                concatMap((returnedOutFilePath) => readLinesObs(returnedOutFilePath)),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                        expect(lines.length).equal(5);
                        const _fileName = './hallo.java';
                        const [language, filename, blank, comment, code] = lines
                            .find((l) => l.includes(_fileName))!
                            .split(',');
                        expect(language).equal('Java');
                        expect(filename).equal(`${_fileName}`);
                        expect(parseInt(blank)).equal(3);
                        expect(parseInt(comment)).equal(1);
                        expect(parseInt(code)).equal(5);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    expect(counter).equal(1);
                    done();
                },
            });
    }).timeout(200000);
});

describe(`createSummaryClocLog`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-cloc-summary.csv`);
        const returnedOutFilePath = createSummaryClocLog(config, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 4 lines: 2 for the 2 languages (java nd python) and 1 for the csv header, which is the first,
                // and one for the sum which is the last
                expect(lines.length).equal(4);
                const _language = 'Java';
                const [files, language, blank, comment, code] = lines.find((l) => l.includes(_language))!.split(',');
                expect(language).equal('Java');
                expect(parseInt(files)).equal(2);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(3);
                expect(parseInt(code)).equal(10);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});

describe(`streamSummaryClocNewProcess`, () => {
    it(`read the cloc summary and notifies each line containing stats for a language over a stream`, (done) => {
        const repo = 'git-repo-with-code';
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir: '',  // outdir should not be mandatory since it is not used in this function    
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileCreatedSync = createSummaryClocLog({ ...config, outDir: './temp/', outClocFilePrefix: 'same-process-' }, 'test');

        clocSummaryAsStreamOfStrings$(config)
            .pipe(
                toArray(),
                concatMap((linesReadFromStream) =>
                    readLinesObs(outFileCreatedSync).pipe(
                        map((linesReadFromFilecreatedSync) => ({
                            linesReadFromStream,
                            linesReadFromFilecreatedSync,
                        })),
                    ),
                ),
                tap({
                    next: ({ linesReadFromStream, linesReadFromFilecreatedSync }) => {
                        // skip the first line of the file written synchronously since it contains the heade of cloc output
                        const _linesReadFromFilecreatedSync = linesReadFromFilecreatedSync.slice(1);
                        expect(_linesReadFromFilecreatedSync.length).equal(linesReadFromStream.length);
                        linesReadFromStream.forEach((line, i) => {
                            //  v 1.92  T=0.01 s (294.9 files/s, 1671.1 lines/s
                            //  v 1.92  T=0.01 s (283.7 files/s, 1607.7 lines/s)
                            const theOtherLine = _linesReadFromFilecreatedSync[i];
                            expect(line).equal(theOtherLine);
                        });
                    },
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(200000);

    it(`read the cloc summary and, while notifying over a streams, writes the summary in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir: '', // outdir should not be mandatory since it is not used in this function
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSynch = createSummaryClocLog({ ...config, outDir: './temp/', outClocFilePrefix: 'same-process' }, 'test');

        const clocSummaryFile = path.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);

        clocSummaryAsStreamOfStrings$(config, clocSummaryFile)
            .pipe(
                toArray(),
                concatMap(() => forkJoin([readLinesObs(outFileSynch), readLinesObs(clocSummaryFile)])),
                tap({
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
                            expect(line).equal(theOtherLine);
                        });
                    },
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(200000);

    it(`tries to read a cloc summary file that does not exist and returns an empty array`, (done) => {
        clocSummaryInfo('not-existing-file').subscribe({
            next: (lines) => {
                expect(lines).empty;
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});

describe(`createSummaryClocNewProcess`, () => {
    it(`read the cloc summary and saves it in a file - uses a different process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');

        const outClocFilePrefix = 'new-process';
        const config: ConfigReadCloc = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSameProcess = createSummaryClocLog({ ...config, outDir: './temp/', outClocFilePrefix: 'same-process' }, 'test');

        const expectedOutFilePath = buildSummaryClocOutfile(config);

        let counter = 0;

        deleteFile(expectedOutFilePath)
            .pipe(
                concatMap(() => createSummaryClocNewProcess(config, 'test')),
                tap({
                    next: (outFile) => {
                        expect(outFile).equal(expectedOutFilePath);
                        counter++;
                    },
                }),
                concatMap((returnedOutFilePath) => readLinesObs(returnedOutFilePath)),
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
                        expect(linesReadInNewProcess.length).equal(linesReadFromFilecreatedSynchronously.length);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    expect(counter).equal(1);
                    done();
                },
            });
    }).timeout(200000);
});
