import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../1-B-git-enriched-streams/commits';
import { AuthorChurnReport } from '../../1-D-reports/author-churn-report';
import { FileAuthorsReport } from '../../1-D-reports/file-authors-report';
import { FileChurnReport, FILE_CHURN_REPORT_NAME } from '../../1-D-reports/file-churn-report';
import { FilesCouplingReport } from '../../1-D-reports/file-coupling-report';
import { MODULE_CHURN_REPORT_NAME, ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import {
    fetchAllDirsFromGivenFolder,
    fetchAllGitReposFromGivenFolder,
    gitRepos,
    runAllReportsOnMultiRepos,
} from './run-reports-on-multi-repos-core';

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
        const moduleChurnRep_0 = data[0].reports.find((r) => r.name === MODULE_CHURN_REPORT_NAME) as ModuleChurnReport;
        expect(fileChurnRep_0.totChurn.val).equal(moduleChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = data[1].reports.find((r) => r.name === FILE_CHURN_REPORT_NAME) as FileChurnReport;
        const moduleChurnRep_1 = data[1].reports.find((r) => r.name === MODULE_CHURN_REPORT_NAME) as ModuleChurnReport;
        expect(fileChurnRep_1.totChurn.val).equal(moduleChurnRep_1.totChurn.val);
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
    }).timeout(200000);
    it(`returns one folder since we start from the folder containing the current project and this folder is a git repo`, (done) => {
        const start = process.cwd();
        gitRepos(start)
            .pipe(
                tap({
                    next: (repos) => {
                        expect(repos).not.undefined;
                        expect(repos.length).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`fetchAllDirsFromGivenFolder`, () => {
    it(`returns all the subfolders contained in the folder of this project`, () => {
        const start = process.cwd();
        const dirs = fetchAllDirsFromGivenFolder(start);
        // we specify a big number of dirs since, in this folder, there the node_modules folder
        // which contains a lot of subfolders
        // This is to avoid that the test succeeds even if the function fetchAllDirsFromGivenFolder
        // returns just the directories found at the top level of the folder of this project
        const aBigNumberOfDirs = 100;
        expect(dirs.length).gt(aBigNumberOfDirs);
    });
});

describe(`fetchAllGitReposFromGivenFolder`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, () => {
        const start = path.parse(process.cwd()).dir;
        const repos = fetchAllGitReposFromGivenFolder(start);
        // in the parent folder of this folder there cab be other git repos
        expect(repos.length).gte(1);
    });
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, () => {
        const start = process.cwd();
        const repos = fetchAllGitReposFromGivenFolder(start);
        // in the folder of this project there is just one git repo
        expect(repos.length).equal(1);
    });
});
