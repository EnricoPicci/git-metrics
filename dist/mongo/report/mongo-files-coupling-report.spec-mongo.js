"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const load_commits_1 = require("../load/load-commits");
const mongo_files_coupling_report_1 = require("./mongo-files-coupling-report");
describe(`_mongoFilesCouplingReport - test the internals of the report generation logic using a real workd repo log`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'io-backend';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection }) => (0, mongo_files_coupling_report_1._mongoFilesCouplingReport)({
            repoFolderPath,
            connectionString,
            dbName,
            commitsCollection,
            outDir: `${process.cwd()}/temp`,
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the churn of files setting a low depth for the report`, (done) => {
        const repoName = 'io-backend';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const depthInFilesCoupling = 10;
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection }) => (0, mongo_files_coupling_report_1._mongoFilesCouplingReport)({
            repoFolderPath,
            connectionString,
            dbName,
            commitsCollection,
            outDir: `${process.cwd()}/temp`,
            depthInFilesCoupling,
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=mongo-files-coupling-report.spec-mongo.js.map