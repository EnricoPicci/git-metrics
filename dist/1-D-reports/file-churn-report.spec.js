"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const from_csv_1 = require("../0-tools/csv/from-csv");
const files_1 = require("../reports-on-repos/1-B-git-enriched-streams/files");
const commits_1 = require("../reports-on-repos/1-B-git-enriched-streams/commits");
const read_all_1 = require("../reports-on-repos/1-A-read/read-all");
const file_churn_report_1 = require("./file-churn-report");
const cloc_1 = require("../reports-on-repos/1-A-read/cloc");
const project_info_aggregate_1 = require("../reports-on-repos/1-C-aggregate-in-memory/project-info-aggregate");
const file_churn_aggregate_1 = require("../reports-on-repos/1-C-aggregate-in-memory/file-churn-aggregate");
describe(`fileChurnReportCore`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const outDir = `${process.cwd()}/temp`;
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        (0, file_churn_report_1.fileChurnReportCore)(fileChurns, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // general tests on the files churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.numFiles.val).equal(3);
            (0, chai_1.expect)(report.totChurn.val).equal(24);
            (0, chai_1.expect)(report.clocTot.val).equal(12);
            (0, chai_1.expect)(report.churn_vs_cloc.val).equal(2);
            (0, chai_1.expect)(report.topChurnedFiles.val.length).equal(3);
            // the value for topChurnContributors is 2 since the default value for the parameter of percentage threshold is used
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(2);
            // the top contributors have been created in 2 different years, so there are 2 keys in the dictionary
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(2);
            //
            const mostChurnedFile = report.topChurnedFiles.val[0];
            (0, chai_1.expect)(mostChurnedFile.path).equal('hallo-lazy.java');
            (0, chai_1.expect)(mostChurnedFile.created.getFullYear()).equal(2020);
            (0, chai_1.expect)(mostChurnedFile.created.getMonth()).equal(8);
            (0, chai_1.expect)(mostChurnedFile.created.getDate()).equal(22);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the churn of files - unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const outDir = `${process.cwd()}/temp`;
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        (0, file_churn_report_1.fileChurnReportCore)(fileChurns, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // general tests on the files churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.numFiles.val).equal(0);
            (0, chai_1.expect)(report.totChurn.val).equal(0);
            (0, chai_1.expect)(report.clocTot.val).equal(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`fileChurnReportCore - test the internals of the report generation logic for specific cases`, () => {
    it(`generates the report about the churn of files with only 1 top churned file`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = './temp';
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const params = {
            commitLog: commitLogPath,
            outDir,
            topChurnFilesSize: 1,
        };
        (0, file_churn_report_1.fileChurnReportCore)(fileChurns, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnedFiles.val.length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`generates the report about the churn of files with percentage of chunk threshold is set to 20, meaning that it stops counting the files that
    contribute to the churn after the accumulated value is higher than 20%`, (done) => {
        const repoName = 'a-git-repo-py';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const percentThreshold = 20;
        const outDir = './temp';
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const params = {
            commitLog: commitLogPath,
            outDir,
            percentThreshold,
        };
        (0, file_churn_report_1.fileChurnReportCore)(fileChurns, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(1);
            const topChurnContributor = report.topChurnContributors.val[0];
            (0, chai_1.expect)(topChurnContributor.path).equal(`good-by.py`);
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`generates the report about the churn of files - the 2 top contributors are both from the same year`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = './temp';
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        (0, file_churn_report_1.fileChurnReportCore)(fileChurns, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(3);
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`projectAndFileChurnReport`, () => {
    it(`generates the report about the churn of files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const outDir = `${process.cwd()}/temp`;
        const after = undefined;
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        // generation of the source streams
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, true, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_churn_report_1.projectAndFileChurnReport)(_fileChurn, _projectInfo, params)
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
    it(`read the csv file generated together with the report`, (done) => {
        const repoFolderPath = 'a-git-repo-with-one-lazy-author';
        const outDir = path_1.default.join(process.cwd(), 'temp');
        const after = undefined;
        const csvFile = path_1.default.join(process.cwd(), 'temp', `${repoFolderPath}.csv`);
        const testDataPath = path_1.default.join(process.cwd(), 'test-data', 'output');
        const [commitLogPath, clocLogPath, clocSummaryPath] = [
            path_1.default.join(testDataPath, `${repoFolderPath}-commits.gitlog`),
            path_1.default.join(testDataPath, `${repoFolderPath}-cloc.gitlog`),
            path_1.default.join(testDataPath, `${repoFolderPath}-summary-cloc.csv`),
        ];
        // generation of the source streams
        const _clocSummaryInfo = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, true, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_churn_report_1.projectAndFileChurnReport)(_fileChurn, _projectInfo, params, csvFile)
            .pipe((0, rxjs_1.concatMap)((report) => {
            return (0, observable_fs_1.readLinesObs)(report.csvFile.val);
        }), (0, rxjs_1.tap)((csvLines) => {
            // there are 3 lines related to the files plus one line as header
            (0, chai_1.expect)(csvLines.length).equal(4);
            // the first object represents the most churned file
            const mostChurnedFile = (0, from_csv_1.fromCsv)(csvLines[0], [csvLines[1]])[0];
            (0, chai_1.expect)(mostChurnedFile.cumulativeChurnPercent).equal(`${(12 / 24) * 100}`);
            (0, chai_1.expect)(mostChurnedFile.cumulativeNumberOfFilesPercent).equal(`${(1 / 3) * 100}`);
            (0, chai_1.expect)(mostChurnedFile.churnRanking).equal(`1`);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the churn of files - considers only the commits after a certain date`, (done) => {
        // input from the user
        const repoFolderPath = 'a-git-repo-with-one-lazy-author';
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2021-01-01');
        const testDataPath = path_1.default.join(process.cwd(), 'test-data', 'output');
        const [commitLogPath, clocLogPath, clocSummaryPath] = [
            path_1.default.join(testDataPath, `${repoFolderPath}-commits.gitlog`),
            path_1.default.join(testDataPath, `${repoFolderPath}-cloc.gitlog`),
            path_1.default.join(testDataPath, `${repoFolderPath}-summary-cloc.csv`),
        ];
        // generation of the source streams
        const _clocSummaryInfo = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, true, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_churn_report_1.projectAndFileChurnReport)(_fileChurn, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // totCommits contains the number of all commits, not only the commits after the after date
            (0, chai_1.expect)(report.totCommits.val).equal(3);
            (0, chai_1.expect)(report.totChurn.val).equal(11);
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
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, true, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream);
        (0, file_churn_report_1.projectAndFileChurnReport)(_fileChurn, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
            (0, chai_1.expect)(report.totCommits.val).gt(0);
            (0, chai_1.expect)(report.clocTot.val).gt(0);
            (0, chai_1.expect)(report.churn_vs_cloc.val).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=file-churn-report.spec.js.map