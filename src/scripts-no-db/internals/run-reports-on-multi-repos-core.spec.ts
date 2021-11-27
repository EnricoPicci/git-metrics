import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../git-read-enrich/commits';
import { AuthorChurnReport, AUTHOR_CHURN_REPORT_NAME } from '../../reports/author-churn-report';
import { FileAuthorsReport } from '../../reports/file-authors-report';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../reports/file-churn-report';
import { FilesCouplingReport } from '../../reports/file-coupling-report';
import { ModuleChurnReport } from '../../reports/module-churn-report';
import { gitRepos, runAllReportsOnMultiRepos } from './run-reports-on-multi-repos-core';

describe(`runAllReportsOnMultiRepos`, () => {
    it(`runs all the reports on an array of projects which happen to be the same current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [AuthorChurnReport.name, FileChurnReport.name, ModuleChurnReport.name];
        const repoFolderPath = process.cwd();
        const repoFolderPaths = [repoFolderPath, repoFolderPath];
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
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
            depthInFilesCoupling,
            false,
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
            depthInFilesCoupling,
            true,
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
        data: {
            reports: (
                | FileChurnReport
                | ModuleChurnReport
                | AuthorChurnReport
                | FileAuthorsReport
                | FilesCouplingReport
            )[];
            repoFolderPath: string;
        }[],
    ) => {
        expect(data.length).equal(2);
        expect(data[0].reports.length).equal(3);
        expect(data[1].reports.length).equal(3);
        //
        const fileChurnRep_0 = data[0].reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const authorChurnRep_0 = data[0].reports.find((r) => r.name === AUTHOR_CHURN_REPORT_NAME) as AuthorChurnReport;
        expect(fileChurnRep_0.totChurn.val).equal(authorChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = data[1].reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const authorChurnRep_1 = data[1].reports.find((r) => r.name === AUTHOR_CHURN_REPORT_NAME) as AuthorChurnReport;
        expect(fileChurnRep_1.totChurn.val).equal(authorChurnRep_1.totChurn.val);
        //
        expect(data[0].repoFolderPath).equal(process.cwd());
        expect(data[1].repoFolderPath).equal(process.cwd());
    };
});

describe(`gitRepos`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, (done) => {
        const start = path.parse(process.cwd()).dir;
        gitRepos(start)
            .pipe(
                tap({
                    next: (repos) => {
                        expect(repos).not.undefined;
                        expect(repos.length).gt(0);
                        const currentFolder = process.cwd();
                        expect(repos.includes(currentFolder)).true;
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, (done) => {
        const start = process.cwd();
        gitRepos(start)
            .pipe(
                tap({
                    next: (repos) => {
                        expect(repos).not.undefined;
                        expect(repos.length).equal(0);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
