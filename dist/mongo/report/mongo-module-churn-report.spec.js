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
        })), (0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            const modules = report.modulesDict.val;
            (0, chai_1.expect)(Object.keys(modules).length).equal(7);
            (0, chai_1.expect)(modules['src/types'].files).equal(1);
            (0, chai_1.expect)(modules['src/types'].linesAdded).equal(100);
            (0, chai_1.expect)(modules['src/types'].linesDeleted).equal(5);
            (0, chai_1.expect)(modules['src/types'].linesAddDel).equal(105);
            (0, chai_1.expect)(modules['src/controllers'].files).equal(2);
            (0, chai_1.expect)(modules['src/controllers'].linesAdded).equal(126);
            (0, chai_1.expect)(modules['src/controllers'].linesDeleted).equal(6);
            (0, chai_1.expect)(modules['src/controllers'].linesAddDel).equal(132);
            (0, chai_1.expect)(modules['src'].files).equal(11);
            (0, chai_1.expect)(modules['src'].linesAdded).equal(468);
            (0, chai_1.expect)(modules['src'].linesDeleted).equal(17);
            (0, chai_1.expect)(modules['src'].linesAddDel).equal(485);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=mongo-module-churn-report.spec.js.map