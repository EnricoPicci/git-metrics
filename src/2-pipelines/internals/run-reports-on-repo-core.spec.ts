import { expect } from 'chai';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../1-B-git-enriched-streams/commits';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../1-D-reports/file-churn-report';
import {
    allReports,
    runReportsSingleThread,
    runReportsParallelReads,
    runReportsOneStream,
} from './run-reports-on-repo-core';
import { MODULE_CHURN_REPORT_NAME, ModuleChurnReport } from '../../1-D-reports/module-churn-report';

describe(`runReportsSingleThread`, () => {
    it(`runs all the reports on this project`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = false;
        const depthInFilesCoupling = 10;

        runReportsSingleThread(
            undefined,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            false,
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        )
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(allReports.length);
                }),
            )
            .subscribe({
                error: (err) => {
                    console.log(typeof err);
                    console.error(err);
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(600000);
    it(`runs some reports on this project both in single and parallel stream mode`, (done) => {
        const reports = [FileChurnReport.name, ModuleChurnReport.name];

        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runReportsSingleThread(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            false, // parallel commit read
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        );

        const runParallelStream = runReportsSingleThread(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            true, // parallel commit read
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        );

        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                    readsInSingleStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                    COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
                }),
                concatMap(() => runParallelStream),
                tap((_reports) => {
                    const fileChurnRep = _reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
                    const moduleChurnRep = _reports.find(
                        (r) => r.name === MODULE_CHURN_REPORT_NAME,
                    ) as ModuleChurnReport;
                    expect(fileChurnRep.totChurn.val).equal(moduleChurnRep.totChurn.val);
                }),
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                    readsInParallelStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                }),
                tap(() => {
                    // in the single stream mode we read once the file containing the commit log
                    const readsOfCommitLog = readsInSingleStream;
                    // With parallel streams there is the same read of the file containing the commit log to build the project info and then there are as many
                    // reads of that file as there are reports to be built
                    expect(readsOfCommitLog + readsOfCommitLog * reports.length).equal(readsInParallelStream);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});

describe(`runReportsParallelReads`, () => {
    it(`runs all the reports on this project - the initial read operations are concurrent`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        runReportsParallelReads(
            undefined,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            false,
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        )
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(allReports.length);
                }),
            )
            .subscribe({
                error: (err) => {
                    console.log(typeof err);
                    console.error(err);
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(600000);
    it(`runs all the reports on this project both in single and parallel stream mode - the initial read operations are concurrent`, (done) => {
        const reports = [FileChurnReport.name, ModuleChurnReport.name];

        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runReportsParallelReads(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            false,
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        );

        const runParallelStream = runReportsParallelReads(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            true,
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        );

        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                    readsInSingleStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                    COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
                }),
                concatMap(() => runParallelStream),
                tap((_reports) => {
                    const fileChurnRep = _reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
                    const moduleChurnRep = _reports.find(
                        (r) => r.name === MODULE_CHURN_REPORT_NAME,
                    ) as ModuleChurnReport;
                    expect(fileChurnRep.totChurn.val).equal(moduleChurnRep.totChurn.val);
                }),
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                    readsInParallelStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                }),
                tap(() => {
                    // in the single stream mode we read once the file containing the commit log
                    const readsOfCommitLog = readsInSingleStream;
                    // With parallel streams there is the same read of the file containing the commit log to build the project info and then there are as many
                    // reads of that file as there are reports to be built
                    expect(readsOfCommitLog + readsOfCommitLog * reports.length).equal(readsInParallelStream);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});

describe(`runReportsOneStream`, () => {
    it(`runs all the reports on this project`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        runReportsOneStream(
            undefined,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            false,
            ignoreClocZero,
            depthInFilesCoupling,
        )
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(allReports.length);
                }),
            )
            .subscribe({
                error: (err) => {
                    console.log(typeof err);
                    console.error(err);
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(600000);
});
