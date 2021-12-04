"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const files_1 = require("../1-B-git-enriched-streams/files");
const file_churn_aggregate_1 = require("./file-churn-aggregate");
const module_churn_aggregate_1 = require("./module-churn-aggregate");
describe(`moduleChurns`, () => {
    it(`generates a stream of ModuleChurn objects`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits);
        (0, module_churn_aggregate_1.moduleChurns)(fileChurns)
            .pipe((0, operators_1.tap)((moduleChurns) => {
            (0, chai_1.expect)(moduleChurns.length).equal(8);
            // there is only one entry for src module
            const src = moduleChurns.filter((mc) => mc.path === './src');
            (0, chai_1.expect)(src.length).equal(1);
            // there is only one entry for src/yypes module
            const srcTypes = moduleChurns.filter((mc) => mc.path === './src/types');
            (0, chai_1.expect)(srcTypes.length).equal(1);
            // there is only one entry for src/controllers module
            const srcControllers = moduleChurns.filter((mc) => mc.path === './src/controllers');
            (0, chai_1.expect)(srcControllers.length).equal(1);
            //
            const srcTypesModuleChurn = srcTypes[0];
            const srcControllersModuleChurn = srcControllers[0];
            const srcModuleChurn = src[0];
            (0, chai_1.expect)(srcTypesModuleChurn.linesAdded).equal(100);
            (0, chai_1.expect)(srcTypesModuleChurn.linesDeleted).equal(5);
            (0, chai_1.expect)(srcTypesModuleChurn.linesAddDel).equal(105);
            (0, chai_1.expect)(srcControllersModuleChurn.numFiles).equal(2);
            (0, chai_1.expect)(srcControllersModuleChurn.linesAdded).equal(126);
            (0, chai_1.expect)(srcControllersModuleChurn.linesDeleted).equal(6);
            (0, chai_1.expect)(srcControllersModuleChurn.linesAddDel).equal(132);
            (0, chai_1.expect)(srcModuleChurn.numFiles).equal(11);
            (0, chai_1.expect)(srcModuleChurn.linesAdded).equal(468);
            (0, chai_1.expect)(srcModuleChurn.linesDeleted).equal(17);
            (0, chai_1.expect)(srcModuleChurn.linesAddDel).equal(485);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./)`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits);
        (0, module_churn_aggregate_1.moduleChurns)(fileChurns)
            .pipe((0, operators_1.tap)((moduleChurns) => {
            (0, chai_1.expect)(moduleChurns.length).equal(1);
            //
            const rootModule = moduleChurns[0];
            (0, chai_1.expect)(rootModule.path).equal('.');
            (0, chai_1.expect)(rootModule.linesAdded).equal(23);
            (0, chai_1.expect)(rootModule.linesDeleted).equal(5);
            (0, chai_1.expect)(rootModule.linesAddDel).equal(28);
            (0, chai_1.expect)(rootModule.numFiles).equal(3);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./) and in a folder (./java)`, (done) => {
        const repoName = 'a-git-repo-with-files-in-root-and-folder';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits);
        (0, module_churn_aggregate_1.moduleChurns)(fileChurns)
            .pipe((0, operators_1.tap)((moduleChurns) => {
            (0, chai_1.expect)(moduleChurns.length).equal(2);
            //
            const rootModule = moduleChurns.find((m) => m.path === '.');
            (0, chai_1.expect)(rootModule.linesAdded).equal(23);
            (0, chai_1.expect)(rootModule.linesDeleted).equal(5);
            (0, chai_1.expect)(rootModule.linesAddDel).equal(28);
            (0, chai_1.expect)(rootModule.numFiles).equal(3);
            //
            const folderModule = moduleChurns.find((m) => m.path === './java');
            (0, chai_1.expect)(folderModule.linesAdded).equal(21);
            (0, chai_1.expect)(folderModule.linesDeleted).equal(4);
            (0, chai_1.expect)(folderModule.linesAddDel).equal(25);
            (0, chai_1.expect)(folderModule.numFiles).equal(2);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=module-churn-aggregate.spec.js.map