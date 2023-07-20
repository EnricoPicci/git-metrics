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
const mongo_module_churn_report_1 = require("./mongo-module-churn-report");
describe(`_mongoFileChurnReport - test the internals of the report generation logic sing a real workd repo log`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const numberOfTopChurnModules = 3;
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then generate the report
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, mongo_module_churn_report_1._mongoModuleChurnReport)({
            repoFolderPath,
            connectionString,
            dbName,
            filesCollection,
            outDir: `${process.cwd()}/temp`,
            numberOfTopChurnModules,
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.numModules.val).equal(8);
            //
            (0, chai_1.expect)(report.topChurnedModules.val.length).equal(numberOfTopChurnModules);
            // the first module in terms of churn is the root since it holds all other modules
            (0, chai_1.expect)(report.topChurnedModules.val[0].path).equal('.');
            // the max number of folders in any module is 4 for "./src/services/__tests__" or "./src/controllers/__tests__"
            (0, chai_1.expect)(report.maxModuleDepth.val).equal(4);
            //
            const clocExpected = 2249;
            const churnExpected = 485;
            (0, chai_1.expect)(report.clocTot.val).equal(clocExpected);
            (0, chai_1.expect)(report.totChurn.val).equal(churnExpected);
            (0, chai_1.expect)(report.churn_vs_cloc.val).equal(churnExpected / clocExpected);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=mongo-module-churn-report.spec-mongo.js.map