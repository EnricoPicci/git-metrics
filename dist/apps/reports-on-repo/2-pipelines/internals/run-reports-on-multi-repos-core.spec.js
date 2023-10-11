"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
const run_reports_on_multi_repos_core_1 = require("./run-reports-on-multi-repos-core");
describe(`runAllReportsOnMultiRepos`, () => {
    it(`runs all the reports on an array of projects which happen to be the same current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name, file_churn_report_1.FileChurnReport.name, module_churn_report_1.ModuleChurnReport.name];
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
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, ignoreClocZero, depthInFilesCoupling, false, // single stream mode
        false);
        const runParallelStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, ignoreClocZero, depthInFilesCoupling, true, // parallel stream mode
        false);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)(checkOnReports), (0, rxjs_1.tap)(() => {
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)(checkOnReports), (0, rxjs_1.tap)(() => {
            readsInParallelStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
        }), (0, rxjs_1.tap)(() => {
            // in the single stream mode we read once the file containing the commit log
            const readsOfCommitLog = readsInSingleStream;
            // With parallel streams there is the same read of the file containing the commit log to build the project info and then there are as many
            // reads of that file as there are reports to be built
            (0, chai_1.expect)(readsOfCommitLog + readsOfCommitLog * reports.length).equal(readsInParallelStream);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
    const checkOnReports = (_reportsInfoTuple) => {
        const reportsInfoTuple = _reportsInfoTuple;
        (0, chai_1.expect)(reportsInfoTuple.length).equal(2);
        const t = reportsInfoTuple[0];
        console.log(t);
        console.log(reportsInfoTuple[0].reports.reports);
        (0, chai_1.expect)(reportsInfoTuple[0].reports.reports.length).equal(3);
        (0, chai_1.expect)(reportsInfoTuple[1].reports.reports.length).equal(3);
        //
        const fileChurnRep_0 = reportsInfoTuple[0].reports.reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const moduleChurnRep_0 = reportsInfoTuple[0].reports.reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_0.totChurn.val).equal(moduleChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = reportsInfoTuple[1].reports.reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const moduleChurnRep_1 = reportsInfoTuple[1].reports.reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_1.totChurn.val).equal(moduleChurnRep_1.totChurn.val);
        //
        (0, chai_1.expect)(reportsInfoTuple[0].repoFolderPath).equal(process.cwd());
        (0, chai_1.expect)(reportsInfoTuple[1].repoFolderPath).equal(process.cwd());
    };
});
//# sourceMappingURL=run-reports-on-multi-repos-core.spec.js.map