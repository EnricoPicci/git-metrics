"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const commits_1 = require("../../git-read-enrich/commits");
const author_churn_report_1 = require("../../reports/author-churn-report");
const file_churn_report_1 = require("../../reports/file-churn-report");
const run_reports_from_multi_repos_core_1 = require("./run-reports-from-multi-repos-core");
describe(`runAllReportsFromMultiRepos`, () => {
    it(`runs the collecting data from an array of projects which happen to contain only the current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const repoFolderPath = path_1.default.parse(process.cwd()).dir;
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        const runSingleStream = (0, run_reports_from_multi_repos_core_1.runAllReportsFromMultiRepos)(repoFolderPath, filter, after, outDir, outFile, clocDefsPath, depthInFilesCoupling, false, false);
        const runParallelStream = (0, run_reports_from_multi_repos_core_1.runAllReportsFromMultiRepos)(repoFolderPath, filter, after, outDir, outFile, clocDefsPath, depthInFilesCoupling, true, false);
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
            // with parallel streams there are as many reads of the file containing the commit log as are the number of reports + 1
            // The reason is that each report reads the file, plus there is a read of the file to produce the projectInfo
            (0, chai_1.expect)(readsInSingleStream * (reports.length + 1)).equal(readsInParallelStream);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
    const checkOnReports = (reports) => {
        (0, chai_1.expect)(reports.length).equal(5);
        //
        const fileChurnRep = reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const authorChurnRep = reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep.totChurn.val).gt(0);
        (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
    };
});
//# sourceMappingURL=run-reports-from-multi-repos-core.spec.js.map