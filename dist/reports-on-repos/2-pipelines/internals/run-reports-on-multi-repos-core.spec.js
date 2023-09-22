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
        const before = new Date().toISOString().split('T')[0];
        const outDir = `${process.cwd()}/temp`;
        const outFile = '';
        const clocDefsPath = '';
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        commits_1.COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;
        const runSingleStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, ignoreClocZero, depthInFilesCoupling, false, // single stream mode
        false);
        const runParallelStream = (0, run_reports_on_multi_repos_core_1.runAllReportsOnMultiRepos)(reports, repoFolderPaths, filter, after, before, outDir, outFile, clocDefsPath, ignoreClocZero, depthInFilesCoupling, true, // parallel stream mode
        false);
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
    const checkOnReports = (_data) => {
        const data = _data;
        (0, chai_1.expect)(data.length).equal(2);
        (0, chai_1.expect)(data[0].reports.length).equal(3);
        (0, chai_1.expect)(data[1].reports.length).equal(3);
        //
        const fileChurnRep_0 = data[0].reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const moduleChurnRep_0 = data[0].reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_0.totChurn.val).equal(moduleChurnRep_0.totChurn.val);
        //
        const fileChurnRep_1 = data[1].reports.find((r) => r.name === file_churn_report_1.FILE_CHURN_REPORT_NAME);
        const moduleChurnRep_1 = data[1].reports.find((r) => r.name === module_churn_report_1.MODULE_CHURN_REPORT_NAME);
        (0, chai_1.expect)(fileChurnRep_1.totChurn.val).equal(moduleChurnRep_1.totChurn.val);
        //
        (0, chai_1.expect)(data[0].repoFolderPath).equal(process.cwd());
        (0, chai_1.expect)(data[1].repoFolderPath).equal(process.cwd());
    };
});
describe(`gitRepos`, () => {
    it.skip(`returns the folders that contain git repos starting from the folder containing this project`, (done) => {
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
    }).timeout(200000);
    it(`returns one folder since we start from the folder containing the current project and this folder is a git repo`, (done) => {
        const start = process.cwd();
        (0, run_reports_on_multi_repos_core_1.gitRepos)(start)
            .pipe((0, rxjs_1.tap)({
            next: (repos) => {
                (0, chai_1.expect)(repos).not.undefined;
                (0, chai_1.expect)(repos.length).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`fetchAllDirsFromGivenFolder`, () => {
    it(`returns all the subfolders contained in the folder of this project`, () => {
        const start = process.cwd();
        const dirs = (0, run_reports_on_multi_repos_core_1.fetchAllDirsFromGivenFolder)(start);
        // we specify a big number of dirs since, in this folder, there the node_modules folder
        // which contains a lot of subfolders
        // This is to avoid that the test succeeds even if the function fetchAllDirsFromGivenFolder
        // returns just the directories found at the top level of the folder of this project
        const aBigNumberOfDirs = 100;
        (0, chai_1.expect)(dirs.length).gt(aBigNumberOfDirs);
    });
});
describe(`fetchAllGitReposFromGivenFolder`, () => {
    it.skip(`returns the folders that contain git repos starting from the folder containing this project`, () => {
        const start = path_1.default.parse(process.cwd()).dir;
        const repos = (0, run_reports_on_multi_repos_core_1.fetchAllGitReposFromGivenFolder)(start);
        // in the parent folder of this folder there cab be other git repos
        (0, chai_1.expect)(repos.length).gte(1);
    });
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, () => {
        const start = process.cwd();
        const repos = (0, run_reports_on_multi_repos_core_1.fetchAllGitReposFromGivenFolder)(start);
        // in the folder of this project there is just one git repo
        (0, chai_1.expect)(repos.length).equal(1);
    });
});
//# sourceMappingURL=run-reports-on-multi-repos-core.spec.js.map