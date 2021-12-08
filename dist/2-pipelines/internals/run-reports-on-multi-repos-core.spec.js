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
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
const run_reports_on_multi_repos_core_1 = require("./run-reports-on-multi-repos-core");
describe(`runAllReportsOnMultiRepos`, () => {
    it(`runs all the reports on an array of projects which happen to be the same current project 
    Reports are run both in single and parallel stream mode`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name, file_churn_report_1.FileChurnReport.name, module_churn_report_1.ModuleChurnReport.name];
        const repoFolderPath = process.cwd();
        const repoFolderPaths = [repoFolderPath, repoFolderPath];
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, depthInFilesCoupling, false, false);
        const runParallelStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, depthInFilesCoupling, true, false);
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
    const checkOnReports = (data) => {
        (0, chai_1.expect)(data.length).equal(2);
        (0, chai_1.expect)(data[0].reports.length).equal(3);
        (0, chai_1.expect)(data[1].reports.length).equal(3);
        //
        const fileChurnRep_0 = data[0].reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const authorChurnRep_0 = data[0].reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_0.totChurn.val).equal(authorChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = data[1].reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const authorChurnRep_1 = data[1].reports.find((r) => r.name === author_churn_report_1.AUTHOR_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_1.totChurn.val).equal(authorChurnRep_1.totChurn.val);
        //
        (0, chai_1.expect)(data[0].repoFolderPath).equal(process.cwd());
        (0, chai_1.expect)(data[1].repoFolderPath).equal(process.cwd());
    };
});
describe(`gitRepos`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, (done) => {
        const start = path_1.default.parse(process.cwd()).dir;
        (0, run_reports_on_multi_repos_core_1.gitRepos)(start)
            .pipe((0, rxjs_1.tap)({
            next: (repos) => {
                (0, chai_1.expect)(repos).not.undefined;
                (0, chai_1.expect)(repos.length).gt(0);
                const currentFolder = process.cwd();
                (0, chai_1.expect)(repos.includes(currentFolder)).true;
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, (done) => {
        const start = process.cwd();
        (0, run_reports_on_multi_repos_core_1.gitRepos)(start)
            .pipe((0, rxjs_1.tap)({
            next: (repos) => {
                (0, chai_1.expect)(repos).not.undefined;
                (0, chai_1.expect)(repos.length).equal(0);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=run-reports-on-multi-repos-core.spec.js.map