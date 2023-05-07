"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
describe(`runReportsSingleThread`, () => {
    it(`runs all the reports on this project`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        (0, run_reports_on_repo_core_1.runReportsSingleThread)(undefined, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, ignoreClocZero, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(run_reports_on_repo_core_1.allReports.length);
        }))
            .subscribe({
            error: (err) => {
                console.log(typeof err);
                console.error(err);
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(600000);
    it(`runs some reports on this project both in single and parallel stream mode`, (done) => {
        const reports = [file_churn_report_1.FileChurnReport.name, module_churn_report_1.ModuleChurnReport.name];
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_repo_core_1.runReportsSingleThread)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, // parallel commit read
        false, ignoreClocZero, depthInFilesCoupling);
        const runParallelStream = (0, run_reports_on_repo_core_1.runReportsSingleThread)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, true, // parallel commit read
        false, ignoreClocZero, depthInFilesCoupling);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)((_reports) => {
            const fileChurnRep = _reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
            const moduleChurnRep = _reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
            (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(moduleChurnRep.totChurn.val);
        }), (0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
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
});
describe(`runReportsParallelReads`, () => {
    it(`runs all the reports on this project - the initial read operations are concurrent`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        (0, run_reports_on_repo_core_1.runReportsParallelReads)(undefined, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, ignoreClocZero, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(run_reports_on_repo_core_1.allReports.length);
        }))
            .subscribe({
            error: (err) => {
                console.log(typeof err);
                console.error(err);
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(600000);
    it(`runs all the reports on this project both in single and parallel stream mode - the initial read operations are concurrent`, (done) => {
        const reports = [file_churn_report_1.FileChurnReport.name, module_churn_report_1.ModuleChurnReport.name];
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_repo_core_1.runReportsParallelReads)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, ignoreClocZero, depthInFilesCoupling);
        const runParallelStream = (0, run_reports_on_repo_core_1.runReportsParallelReads)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, true, false, ignoreClocZero, depthInFilesCoupling);
        let readsInSingleStream = 0;
        let readsInParallelStream = 0;
        runSingleStream
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
            readsInSingleStream = commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines;
            commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        }), (0, rxjs_1.concatMap)(() => runParallelStream), (0, rxjs_1.tap)((_reports) => {
            const fileChurnRep = _reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
            const moduleChurnRep = _reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
            (0, chai_1.expect)(fileChurnRep.totChurn.val).equal(moduleChurnRep.totChurn.val);
        }), (0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
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
});
describe(`runReportsOneStream`, () => {
    it(`runs all the reports on this project`, (done) => {
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        (0, run_reports_on_repo_core_1.runReportsOneStream)(undefined, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, ignoreClocZero, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(run_reports_on_repo_core_1.allReports.length);
        }))
            .subscribe({
            error: (err) => {
                console.log(typeof err);
                console.error(err);
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-reports-on-repo-core.spec.js.map