"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const load_commits_1 = require("../load/load-commits");
const load_files_1 = require("../load/load-files");
const mongo_file_author_report_1 = require("./mongo-file-author-report");
describe(`mongoFileAuthorReport`, () => {
    it(`generates the report about the authors of the files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
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
            return (0, mongo_file_author_report_1.mongoFileAuthorReportWithProjectInfo)({
                repoFolderPath,
                outDir,
                connectionString,
                dbName,
                commitsCollection,
                filesCollection,
            });
        }), (0, rxjs_1.tap)((report) => {
            // tests on the general project info held in the report
            (0, chai_1.expect)(report.totCommits.val).equal(4);
            // general tests on the author churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.fewAutorsFiles.val.length).equal(1);
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].commits).equal(1);
            (0, chai_1.expect)(report.manyAutorsFiles.val.length).equal(1);
            (0, chai_1.expect)(report.manyAutorsFiles.val[0].path).equal('touched-by-Authors-1-2-3-4.java');
            (0, chai_1.expect)(report.manyAutorsFiles.val[0].commits).equal(4);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=mongo-file-author-report.spec-mongo.js.map