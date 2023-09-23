"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const from_csv_1 = require("../../../../tools/csv/from-csv");
const load_commits_1 = require("../load/load-commits");
const load_files_1 = require("../load/load-files");
const mongo_file_churn_report_1 = require("./mongo-file-churn-report");
describe(`mongoFileChurnReport`, () => {
    it(`generates the report about the churn of files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection, commitsCollection }) => {
            const outDir = `${process.cwd()}/temp`;
            return (0, mongo_file_churn_report_1.mongoFileChurnReportWithProjectInfo)({
                repoFolderPath,
                outDir,
                connectionString,
                dbName,
                commitsCollection,
                filesCollection,
            });
        }), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.totCommits.val).equal(3);
            (0, chai_1.expect)(report.firstCommitDate.val.getFullYear()).equal(2019);
            (0, chai_1.expect)(report.lastCommitDate.val.getFullYear()).equal(2021);
            // general tests on the files churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.params.val.connectionString.includes('mongodb://')).false;
            (0, chai_1.expect)(report.numFiles.val).equal(3);
            (0, chai_1.expect)(report.totChurn.val).equal(24);
            (0, chai_1.expect)(report.clocTot.val).equal(12);
            (0, chai_1.expect)(report.churn_vs_cloc.val).equal(2);
            (0, chai_1.expect)(report.topChurnedFiles.val.length).equal(3);
            // the value for topChurnContributors is 2 since the default value for the parameter of percentage threshold is used
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(2);
            // the top contributors have been created in 2 different years, so there are 2 keys in the dictionary
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(2);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read the csv file generated together with the report`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const outDir = path_1.default.join(process.cwd(), 'temp');
        const csvFileName = path_1.default.join(outDir, `${repoName}.csv`);
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection, commitsCollection }) => {
            return (0, mongo_file_churn_report_1.mongoFileChurnReportWithProjectInfo)({
                repoFolderPath,
                outDir,
                connectionString,
                dbName,
                commitsCollection,
                filesCollection,
            }, csvFileName);
        }), (0, rxjs_1.concatMap)((report) => {
            return (0, observable_fs_1.readLinesObs)(report.csvFile.val);
        }), (0, rxjs_1.tap)((csvLines) => {
            // there are 3 lines related to the files plus one line as header
            (0, chai_1.expect)(csvLines.length).equal(4);
            // the second line represents the most churned file
            const mostChurnedFile = (0, from_csv_1.fromCsv)(csvLines[0], [csvLines[1]])[0];
            (0, chai_1.expect)(mostChurnedFile.cumulativeChurnPercent).equal(((12 / 24) * 100).toString());
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`_mongoFileChurnReport - test the internals of the report generation logic for specific cases`, () => {
    it(`generates the report about the churn of files with only 1 top churned file`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, mongo_file_churn_report_1._mongoFileChurnReport)({
            repoFolderPath,
            connectionString,
            dbName,
            filesCollection,
            topChurnFilesSize: 1,
            outDir: '',
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnedFiles.val.length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`generates the report about the churn of files with percentage of chunk threshold is set to 20, meaning that it stops counting the files that
    contribute to the churn after the accumulated value is higher than 20%`, (done) => {
        const repoName = 'a-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const percentThreshold = 20;
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, mongo_file_churn_report_1._mongoFileChurnReport)({
            repoFolderPath,
            connectionString,
            dbName,
            filesCollection,
            percentThreshold,
            outDir: '',
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(1);
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`generates the report about the churn of files - the 2 top contributors are both from the same year`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, mongo_file_churn_report_1._mongoFileChurnReport)({
            repoFolderPath,
            connectionString,
            dbName,
            filesCollection,
            outDir: '',
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.topChurnContributors.val.length).equal(3);
            (0, chai_1.expect)(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=mongo-file-churn-report.spec-mongo.js.map