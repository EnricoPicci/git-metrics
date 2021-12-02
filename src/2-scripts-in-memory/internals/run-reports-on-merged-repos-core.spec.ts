import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../1-B-git-enriched-streams/commits';
import { AuthorChurnReport, AUTHOR_CHURN_REPORT_NAME } from '../../1-D-reports/author-churn-report';
import { FileAuthorsReport } from '../../1-D-reports/file-authors-report';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../1-D-reports/file-churn-report';
import { FilesCouplingReport } from '../../1-D-reports/file-coupling-report';
import { ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import { runAllReportsOnMergedRepos } from './run-reports-on-merged-repos-core';

describe(`runAllReportsOnMergedRepos`, () => {
    it(`runs the collecting data from an array of projects which happen to contain only the current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [AuthorChurnReport.name, FileChurnReport.name];
        const repoFolderPath = path.parse(process.cwd()).dir;
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runAllReportsOnMergedRepos(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            depthInFilesCoupling,
            false,
            false,
        );

        const runParallelStream = runAllReportsOnMergedRepos(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            depthInFilesCoupling,
            true,
            false,
        );

        let readsInSingleStream = 0;
        let readsInParallelStream = 0;

        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        runSingleStream
            .pipe(
                tap(checkOnReports),
                tap(() => {
                    readsInSingleStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                    COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
                }),
                concatMap(() => runParallelStream),
                tap(checkOnReports),
                tap(() => {
                    readsInParallelStream = COMMIT_RECORD_COUNTER.numberOfCommitLines;
                }),
                tap((reports) => {
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

    const checkOnReports = (
        reports: (FileChurnReport | ModuleChurnReport | AuthorChurnReport | FileAuthorsReport | FilesCouplingReport)[],
    ) => {
        expect(reports.length).equal(reports.length);
        //
        const fileChurnRep = reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const authorChurnRep = reports.find((r) => r.name === AUTHOR_CHURN_REPORT_NAME) as AuthorChurnReport;
        expect(fileChurnRep.totChurn.val).gt(0);
        expect(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
    };
});
