import { expect } from 'chai';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../git-read-enrich/commits';
import { AuthorChurnReport, AUTHOR_CHURN_REPORT_NAME } from '../../reports/author-churn-report';
import { BranchesReport } from '../../reports/branches-report';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../reports/file-churn-report';
import { allReports, runReports } from './run-reports-on-repo-core';

describe(`runReports`, () => {
    it(`runs all the reports on this project`, (done) => {
        const repoFolderPath = process.cwd();
        //const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;

        runReports(
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
            depthInFilesCoupling,
        )
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(allReports.length);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
    it(`runs some reports on this project both in single and parallel stream mode`, (done) => {
        const reports = [AuthorChurnReport.name, FileChurnReport.name];

        const repoFolderPath = process.cwd();
        //const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runReports(
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
            depthInFilesCoupling,
        );

        const runParallelStream = runReports(
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
                    const authorChurnRep = _reports.find(
                        (r) => r.name === AUTHOR_CHURN_REPORT_NAME,
                    ) as AuthorChurnReport;
                    expect(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
                }),
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                    readsInParallelStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                }),
                tap(() => {
                    // in the single stream mode we read twice the file containing the commit log: once for to build the project info aand once to actually
                    // produce all the reports (all the reports are build with just one read stream which is shared among all report builders). Therefore
                    // to calculate how many reads are done in one round of reads of the commit log we have to divide the readsInSingleStream by 2
                    const readsOfCommitLog = readsInSingleStream / 2;
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
    it.skip(`runs some reports on any project project`, (done) => {
        const reports = [BranchesReport.name];

        // const repoFolderPath = process.cwd();
        // const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/git`;
        const repoFolderPath = `~/temp/git-project/git`;

        const filter = undefined;
        const after = undefined;
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;

        runReports(
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
            depthInFilesCoupling,
        )
            .pipe(
                tap((_reports) => {
                    expect(_reports.length).equal(reports.length);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});
