"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const files_1 = require("../1-B-git-enriched-streams/files");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const module_churn_report_1 = require("./module-churn-report");
const cloc_1 = require("../1-A-read/cloc");
const project_info_aggregate_1 = require("../1-C-aggregate-in-memory/project-info-aggregate");
const file_churn_aggregate_1 = require("../1-C-aggregate-in-memory/file-churn-aggregate");
const module_churn_aggregate_1 = require("../1-C-aggregate-in-memory/module-churn-aggregate");
const observable_fs_1 = require("observable-fs");
const from_csv_1 = require("../../../tools/csv/from-csv");
const read_all_1 = require("../1-A-read/read-all");
describe(`projectAndModuleChurnReport`, () => {
    it(`generates the report about the churn of modules`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true).pipe((0, rxjs_1.share)());
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurns);
        const numberOfTopChurnModules = 3;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
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
    it(`generates the report about the churn of modules in case of a repo with files in root and in a folder`, (done) => {
        const repoName = 'a-git-repo-with-files-in-root-and-folder';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true).pipe((0, rxjs_1.share)());
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurns);
        const numberOfTopChurnModules = 3;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.numModules.val).equal(2);
            //
            (0, chai_1.expect)(report.topChurnedModules.val.length).equal(2);
            // the first module in terms of churn is the root (./) since it holds all other modules
            (0, chai_1.expect)(report.topChurnedModules.val[0].path).equal('.');
            // the max number of folders is 2 for "./java"
            (0, chai_1.expect)(report.maxModuleDepth.val).equal(2);
            //
            const clocExpected = 11;
            const churnExpected = 28;
            (0, chai_1.expect)(report.clocTot.val).equal(clocExpected);
            (0, chai_1.expect)(report.totChurn.val).equal(churnExpected);
            (0, chai_1.expect)(report.churn_vs_cloc.val).equal(churnExpected / clocExpected);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read the csv file generated together with the report`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true).pipe((0, rxjs_1.share)());
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurns);
        const numberOfTopChurnModules = 3;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };
        const csvFile = path_1.default.join(outDir, repoName);
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params, csvFile)
            .pipe((0, rxjs_1.concatMap)((report) => {
            return (0, observable_fs_1.readLinesObs)(report.csvFile.val);
        }), (0, rxjs_1.tap)((csvLines) => {
            // there are 8 lines related to the modules plus one line as header
            (0, chai_1.expect)(csvLines.length).equal(9);
            //
            const churnedModules = (0, from_csv_1.fromCsv)(csvLines[0], csvLines.slice(1));
            // the first object represents the most churned module
            const mostChurnedModule = churnedModules[0];
            (0, chai_1.expect)(mostChurnedModule.level_0).equal('.');
            (0, chai_1.expect)(mostChurnedModule.level_1).equal('');
            (0, chai_1.expect)(mostChurnedModule.level_2).equal('');
            (0, chai_1.expect)(mostChurnedModule.level_3).equal('');
            // the last object represents the least churned module
            const leastChurnedModule = churnedModules[churnedModules.length - 1];
            (0, chai_1.expect)(leastChurnedModule.level_0).equal('.');
            (0, chai_1.expect)(leastChurnedModule.level_1).equal('src');
            (0, chai_1.expect)(leastChurnedModule.level_2).equal('services');
            (0, chai_1.expect)(leastChurnedModule.level_3).equal('__tests__');
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the churn of modules - considers only commits after a certain date`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const after = new Date('2021-09-01');
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true, after).pipe((0, rxjs_1.share)());
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurns);
        const numberOfTopChurnModules = 10;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
            numberOfTopChurnModules,
        };
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            const modules = report.topChurnedModules.val;
            (0, chai_1.expect)(Object.values(modules).filter((m) => m.linesAddDel > 0).length).equal(4);
            //
            const srcServices = modules.find((m) => m.path === './src/services');
            (0, chai_1.expect)(srcServices.numChurnedFiles).equal(3);
            (0, chai_1.expect)(srcServices.linesAdded).equal(2);
            (0, chai_1.expect)(srcServices.linesDeleted).equal(1);
            (0, chai_1.expect)(srcServices.linesAddDel).equal(3);
            //
            const srcServicesTests = modules.find((m) => m.path === './src/services/__tests__');
            (0, chai_1.expect)(srcServicesTests.numChurnedFiles).equal(2);
            (0, chai_1.expect)(srcServicesTests.linesAdded).equal(2);
            (0, chai_1.expect)(srcServicesTests.linesDeleted).equal(1);
            (0, chai_1.expect)(srcServicesTests.linesAddDel).equal(3);
            //
            (0, chai_1.expect)(report.numModules.val).equal(8);
            (0, chai_1.expect)(report.numChangedModules.val).equal(4);
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
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(_fileChurn);
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
            (0, chai_1.expect)(report).not.undefined;
            const modules = report.topChurnedModules.val;
            (0, chai_1.expect)(modules).not.undefined;
            (0, chai_1.expect)(Object.keys(modules).length).gt(0);
            //
            const srcModule = modules.find((m) => m.path === './src');
            (0, chai_1.expect)(srcModule).not.undefined;
            (0, chai_1.expect)(srcModule.numChurnedFiles).gt(0);
            (0, chai_1.expect)(srcModule.linesAdded).gt(0);
            (0, chai_1.expect)(srcModule.linesDeleted).gt(0);
            (0, chai_1.expect)(srcModule.linesAddDel).equal(srcModule.linesAdded + srcModule.linesDeleted);
            (0, chai_1.expect)(report.numModules.val).gt(0);
            (0, chai_1.expect)(report.topChurnedModules.val.length).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the churn of modules - 
    unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true).pipe((0, rxjs_1.share)());
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurns);
        const numberOfTopChurnModules = 3;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };
        (0, module_churn_report_1.projectAndModuleChurnReport)(moduleChurnsStream, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.numModules.val).equal(0);
            //
            (0, chai_1.expect)(report.topChurnedModules.val.length).equal(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=module-churn-report.spec.js.map