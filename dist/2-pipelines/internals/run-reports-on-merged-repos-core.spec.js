"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const run_reports_on_merged_repos_core_1 = require("./run-reports-on-merged-repos-core");
describe(`runAllReportsOnMergedRepos`, () => {
    it(`runs the collecting data from an array of projects which happen to contain only the current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name, file_churn_report_1.FileChurnReport.name];
        const repoFolderPath = path_1.default.parse(process.cwd()).dir;
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, depthInFilesCoupling, false, false);
        const runParallelStream = (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, depthInFilesCoupling, true, false);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)(checkOnReports), (0, rxjs_1.tap)(() => {
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)(checkOnReports), (0, rxjs_1.tap)(() => {
            readsInParallelStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
        }), (0, rxjs_1.tap)((reports) => {
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
    const checkOnReports = (reports) => {
        (0, chai_1.expect)(reports.length).equal(reports.length);
        //
        const fileChurnRep = reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const authorChurnRep = reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep.totChurn.val).gt(0);
        (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
    };
});
//# sourceMappingURL=run-reports-on-merged-repos-core.spec.js.map