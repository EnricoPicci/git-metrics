"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
const run_reports_on_merged_repos_core_1 = require("./run-reports-on-merged-repos-core");
const path_1 = __importDefault(require("path"));
const chai_1 = require("chai");
describe(`runAllReportsOnMergedRepos`, () => {
    it(`runs all the reports after merging all the repo gitlogs for the repos present in the src folder.
    Considering that this folder does not contain any directory with a repo, the merge will merge no repos.`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name, file_churn_report_1.FileChurnReport.name, module_churn_report_1.ModuleChurnReport.name];
        const repoFolderPath = path_1.default.join(process.cwd(), 'src');
        const filter = ['*.ts'];
        const after = new Date('2021-10-01');
        const before = new Date();
        const outDir = `${process.cwd()}/temp`;
        const outFile = '';
        const clocDefsPath = '';
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        const concurrentReadOfCommits = false;
        const noRenames = true;
        const excludeRepoPaths = [];
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, ignoreClocZero, depthInFilesCoupling, concurrentReadOfCommits, // single stream mode
        noRenames, excludeRepoPaths);
        runSingleStream
            .pipe((0, rxjs_1.tap)((report) => {
            // expect report to be defined
            (0, chai_1.expect)(report).to.not.be.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
    it(`runs all the reports after merging all the repo gitlogs for the repos present in this project folder.
    Considering that this folder contains only one repo repo, the merge will have just this repo.`, (done) => {
        const reports = [author_churn_report_1.AuthorChurnReport.name];
        const repoFolderPath = './';
        const filter = [];
        const after = new Date('2023-10-01');
        const before = new Date();
        const outDir = `${process.cwd()}/temp`;
        const outFilePrefix = 'microserv';
        const clocDefsPath = '';
        const ignoreClocZero = false;
        const depthInFilesCoupling = 10;
        const concurrentReadOfCommits = false;
        const noRenames = true;
        const excludeRepoPaths = [];
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_merged_repos_core_1.runAllReportsOnMergedRepos)(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, concurrentReadOfCommits, // single stream mode
        noRenames, excludeRepoPaths);
        runSingleStream
            .pipe((0, rxjs_1.tap)((report) => {
            // expect report to be defined
            (0, chai_1.expect)(report).to.not.be.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-reports-on-merged-repos-core.spec.js.map