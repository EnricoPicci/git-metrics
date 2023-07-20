"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const author_churn_aggregate_1 = require("../1-C-aggregate-in-memory/author-churn-aggregate");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const read_all_1 = require("../1-A-read/read-all");
const author_churn_report_1 = require("./author-churn-report");
const cloc_1 = require("../1-A-read/cloc");
const project_info_aggregate_1 = require("../1-C-aggregate-in-memory/project-info-aggregate");
describe(`authorChurnReport`, () => {
    it(`generates the report about the churn generated by the authors`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        const fileChurnStream = (0, author_churn_aggregate_1.authorChurn)(commits);
        const outDir = './temp';
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        (0, author_churn_report_1.authorChurnReportCore)(fileChurnStream, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.numAuthors.val).equal(3);
            (0, chai_1.expect)(report.totChurn.val).equal(155);
            (0, chai_1.expect)(report.topAuthors.val.length).equal(3);
            (0, chai_1.expect)(report.topAuthorChurnContributors.val.length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the  churn generated by the authors - 
        unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        const fileChurnStream = (0, author_churn_aggregate_1.authorChurn)(commits);
        const outDir = './temp';
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        (0, author_churn_report_1.authorChurnReportCore)(fileChurnStream, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.numAuthors.val).equal(0);
            (0, chai_1.expect)(report.totChurn.val).equal(0);
            (0, chai_1.expect)(report.topAuthors.val.length).equal(0);
            (0, chai_1.expect)(report.topAuthorChurnContributors.val.length).equal(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`authorChurnReport - test some special cases`, () => {
    it(`generates the report about the churn generated by authors with only 1 top author`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        const fileChurnStream = (0, author_churn_aggregate_1.authorChurn)(commits);
        const outDir = './temp';
        const params = {
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnAuthors: 1,
        };
        (0, author_churn_report_1.authorChurnReportCore)(fileChurnStream, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topAuthors.val.length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`generates the report about the churn generated by authors with percentage of chunk threshold is set to 95,
    meaning that it stops counting the files that contribute to the churn after the accumulated value is higher than 95%
    In this case the top  contributors required to reach the threshold are 2 considering the distribution of churn in tha input commits log file`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        const fileChurnStream = (0, author_churn_aggregate_1.authorChurn)(commits);
        const outDir = './temp';
        const params = {
            commitLog: commitLogPath,
            outDir,
            percentThreshold: 95,
        };
        (0, author_churn_report_1.authorChurnReportCore)(fileChurnStream, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topAuthorChurnContributors.val.length).equal(2);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`authorChurnReportWithProjectInfo`, () => {
    it(`generates the report about the author churns as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, author_churn_report_1.projectAndAuthorChurnReport)(_authorChurn, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.totCommits.val).equal(3);
            (0, chai_1.expect)(report.firstCommitDate.val.getFullYear()).equal(2019);
            (0, chai_1.expect)(report.lastCommitDate.val.getFullYear()).equal(2021);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about authors churns - considers only the commits after a certain date`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2021-01-01');
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, author_churn_report_1.projectAndAuthorChurnReport)(_authorChurn, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // totCommits contains the number of all commits, not only the commits after the after date
            (0, chai_1.expect)(report.totCommits.val).equal(3);
            (0, chai_1.expect)(report.totChurn.val).equal(132);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read - source stream generation - aggregation - generation of the report about this project`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const filter = ['*.ts'];
        const after = undefined;
        // read
        const commitOptions = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream);
        (0, author_churn_report_1.projectAndAuthorChurnReport)(_authorChurn, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
            (0, chai_1.expect)(report.totCommits.val).gt(0);
            (0, chai_1.expect)(report.totChurn.val).gt(0);
            (0, chai_1.expect)(report.numAuthors.val).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=author-churn-report.spec.js.map