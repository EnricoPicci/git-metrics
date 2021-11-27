"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const load_commits_1 = require("../load/load-commits");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
describe(`projectInfo`, () => {
    it(`calculates the general project info`, (done) => {
        const repoName = 'a-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = {
            repoFolderPath,
            outDir: `${process.cwd()}/temp`,
            connectionString,
        };
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
        // once the commits have been loaded we can calculate the project info
        (0, rxjs_1.concatMap)(({ commitsCollection }) => {
            return (0, mongo_add_prj_info_1.mongoProjectInfo)(Object.assign(Object.assign({}, params), { commitsCollection }));
        }), (0, rxjs_1.tap)((prjInfo) => {
            (0, chai_1.expect)(prjInfo.commits.count).equal(3);
            (0, chai_1.expect)(prjInfo.commits.first.committerDate.getFullYear()).equal(2019);
            (0, chai_1.expect)(prjInfo.commits.last.committerDate.getFullYear()).equal(2021);
            (0, chai_1.expect)(prjInfo.clocSummaryInfo.length).equal(4);
            const containsOneLineForJava = prjInfo.clocSummaryInfo.filter((l) => l.includes('Java')).length === 1;
            (0, chai_1.expect)(containsOneLineForJava).true;
            const containsOneLineForPython = prjInfo.clocSummaryInfo.filter((l) => l.includes('Python')).length === 1;
            (0, chai_1.expect)(containsOneLineForPython).true;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=mongo-add-prj-info.spec-mongo.js.map