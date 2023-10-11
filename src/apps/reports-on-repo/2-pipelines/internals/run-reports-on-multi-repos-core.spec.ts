import { expect } from 'chai';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../1-B-git-enriched-streams/commits';
import { AuthorChurnReport } from '../../1-D-reports/author-churn-report';
import { FileAuthorsReport } from '../../1-D-reports/file-authors-report';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../1-D-reports/file-churn-report';
import { FilesCouplingReport } from '../../1-D-reports/file-coupling-report';
import { MODULE_CHURN_REPORT_NAME, ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import { runAllReportsOnMultiRepos } from './run-reports-on-multi-repos-core';

describe(`runAllReportsOnMultiRepos`, () => {
    it(`runs all the reports on an array of projects which happen to be the same current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [AuthorChurnReport.name, FileChurnReport.name, ModuleChurnReport.name];
        const repoFolderPath = process.cwd();
        const repoFolderPaths = [repoFolderPath, repoFolderPath];
        const filter = ['*.ts'];
        const after = new Date('2021-10-01');
        const before = new Date();
        const outDir = `${process.cwd()}/temp`;
        const outFile = '';
        const clocDefsPath = '';
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runAllReportsOnMultiRepos(
            reports,
            repoFolderPaths,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            ignoreClocZero,
            depthInFilesCoupling,
            false, // single stream mode
            false,
        );

        const runParallelStream = runAllReportsOnMultiRepos(
            reports,
            repoFolderPaths,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            ignoreClocZero,
            depthInFilesCoupling,
            true, // parallel stream mode
            false,
        );

        let readsInSingleStream = 0;
        let readsInParallelStream = 0;

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

    const checkOnReports = (
        _reportsInfoTuple: any,
    ) => {
        const reportsInfoTuple = _reportsInfoTuple as {
            reports: {
                reports: (
                    | FileChurnReport
                    | ModuleChurnReport
                    | AuthorChurnReport
                    | FileAuthorsReport
                    | FilesCouplingReport
                )[], summaryReportPath: string
            };
            repoFolderPath: string;
        }[]
        expect(reportsInfoTuple.length).equal(2);
        const t = reportsInfoTuple[0]
        console.log(t)
        console.log(reportsInfoTuple[0].reports.reports)
        expect(reportsInfoTuple[0].reports.reports.length).equal(3);
        expect(reportsInfoTuple[1].reports.reports.length).equal(3);
        //
        const fileChurnRep_0 = reportsInfoTuple[0].reports.reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const moduleChurnRep_0 = reportsInfoTuple[0].reports.reports.find((r) => r.name === MODULE_CHURN_REPORT_NAME) as ModuleChurnReport;
        expect(fileChurnRep_0.totChurn.val).equal(moduleChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = reportsInfoTuple[1].reports.reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const moduleChurnRep_1 = reportsInfoTuple[1].reports.reports.find((r) => r.name === MODULE_CHURN_REPORT_NAME) as ModuleChurnReport;
        expect(fileChurnRep_1.totChurn.val).equal(moduleChurnRep_1.totChurn.val);
        //
        expect(reportsInfoTuple[0].repoFolderPath).equal(process.cwd());
        expect(reportsInfoTuple[1].repoFolderPath).equal(process.cwd());
    };
});
