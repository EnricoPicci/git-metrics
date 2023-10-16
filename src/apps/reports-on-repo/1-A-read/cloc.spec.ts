import { expect } from 'chai';
import path from 'path';
import { tap, concatMap, toArray, map } from 'rxjs/operators';
import { readLinesObs } from 'observable-fs';
import { clocSummaryAsStreamOfStrings$ } from './cloc';
import { forkJoin } from 'rxjs';
import { ClocParams } from '../../../cloc-functions/cloc-params';
import { writeClocSummary } from '../../../cloc-functions/cloc';

describe(`clocSummaryAsStreamOfStrings$`, () => {
    it(`read the cloc summary and notifies each line containing stats for a language over a stream`, (done) => {
        const repo = 'git-repo-with-code';
        const clocParams: ClocParams = {
            folderPath: `./test-data/${repo}`,
            outDir: '', // outdir should not be mandatory since it is not used in this function
            vcs: 'git',
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileCreatedSync = writeClocSummary(
            { ...clocParams, outDir: './temp/', outClocFilePrefix: 'same-process-' },
            'test',
        );

        clocSummaryAsStreamOfStrings$(clocParams)
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
        const params: ClocParams = {
            folderPath: `./test-data/${repo}`,
            outDir: '', // outdir should not be mandatory since it is not used in this function
            vcs: 'git',
        };
        // executes the summary cloc command synchronously to allow a test that compares this result with the result obtained by createClocNewProcess
        const outFileSynch = writeClocSummary(
            { ...params, outDir: './temp/', outClocFilePrefix: 'same-process' },
            'test',
        );

        const clocSummaryFile = path.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);

        clocSummaryAsStreamOfStrings$(params, clocSummaryFile)
            .pipe(
                toArray(),
                concatMap((stringsFromStream) =>
                    forkJoin([readLinesObs(outFileSynch), readLinesObs(clocSummaryFile)]).pipe(
                        map(([linesReadSync, linesReadFromFileWrittenInThisTest]) => [
                            linesReadSync,
                            linesReadFromFileWrittenInThisTest,
                            stringsFromStream,
                        ]),
                    ),
                ),
                tap({
                    next: ([linesReadSync, linesReadFromFileWrittenInThisTest, stringsFromStream]) => {
                        // each line which has been notified over the stream should be present in both files,
                        // the one written synchronously at the beginning of the test and and the one written
                        // as part of the stream
                        // the content of linesReadSync and linesReadFromFileWrittenInThisTest may differ because of
                        // header and other initial lines, but what is important, is that the lines notified over the
                        // stream are present in both files
                        stringsFromStream.forEach((line) => {
                            expect(linesReadSync).contain(line);
                            expect(linesReadFromFileWrittenInThisTest).contain(line);
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
});
