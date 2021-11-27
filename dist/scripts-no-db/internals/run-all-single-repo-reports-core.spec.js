"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../../git-read-enrich/commits");
const author_churn_report_1 = require("../../reports/author-churn-report");
const file_churn_report_1 = require("../../reports/file-churn-report");
const run_all_single_repo_reports_core_1 = require("./run-all-single-repo-reports-core");
describe(`runAllSingleRepoReports`, () => {
    it(`runs all the reports on this project both in single and parallel stream mode`, (done) => {
        const repoFolderPath = process.cwd();
        //const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_all_single_repo_reports_core_1.runAllSingleRepoReports)(repoFolderPath, filter, after, outDir, outFile, clocDefsPath, depthInFilesCoupling, false, false);
        const runParallelStream = (0, run_all_single_repo_reports_core_1.runAllSingleRepoReports)(repoFolderPath, filter, after, outDir, outFile, clocDefsPath, depthInFilesCoupling, true, false);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)((reports) => {
            (0, chai_1.expect)(reports.length).equal(5);
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)((reports) => {
            const fileChurnRep = reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
            const authorChurnRep = reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
            (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(authorChurnRep.totChurn.val);
        }), (0, rxjs_1.tap)((reports) => {
            (0, chai_1.expect)(reports.length).equal(5);
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
});
//# sourceMappingURL=run-all-single-repo-reports-core.spec.js.map