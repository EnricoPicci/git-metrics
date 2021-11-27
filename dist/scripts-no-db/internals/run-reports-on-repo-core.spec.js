"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../../git-read-enrich/commits");
const author_churn_report_1 = require("../../reports/author-churn-report");
const branches_report_1 = require("../../reports/branches-report");
const file_churn_report_1 = require("../../reports/file-churn-report");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
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
        (0, run_reports_on_repo_core_1.runReports)(undefined, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(run_reports_on_repo_core_1.allReports.length);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
    it(`runs some reports on this project both in single and parallel stream mode`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name, file_churn_report_1.FileChurnReport.name];
        const repoFolderPath = process.cwd();
        //const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_repo_core_1.runReports)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, depthInFilesCoupling);
        const runParallelStream = (0, run_reports_on_repo_core_1.runReports)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, true, false, depthInFilesCoupling);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)((_reports) => {
            const fileChurnRep = _reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
            const authorChurnRep = _reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
            (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
        }), (0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
            readsInParallelStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
        }), (0, rxjs_1.tap)(() => {
            // in the single stream mode we read twice the file containing the commit log: once for to build the project info aand once to actually
            // produce all the reports (all the reports are build with just one read stream which is shared among all report builders). Therefore
            // to calculate how many reads are done in one round of reads of the commit log we have to divide the readsInSingleStream by 2
            const readsOfCommitLog = readsInSingleStream / 2;
            // With parallel streams there is the same read of the file containing the commit log to build the project info and then there are as many
            // reads of that file as there are reports to be built
            (0, chai_1.expect)(readsOfCommitLog + readsOfCommitLog * reports.length).equal(readsInParallelStream);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
    it.skip(`runs some reports on any project project`, (done) => {
        const reports = [branches_report_1.BranchesReport.name];
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
        (0, run_reports_on_repo_core_1.runReports)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-reports-on-repo-core.spec.js.map