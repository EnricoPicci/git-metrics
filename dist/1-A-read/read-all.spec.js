"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const read_all_1 = require("./read-all");
describe(`readAllConcurrent`, () => {
    it(`performs all the read operations concurrently`, () => {
        const repoFolderPath = process.cwd();
        const outDir = `${process.cwd()}/temp`;
        const outFile = 'read-all-concurrent';
        const gitCommitConfig = {
            repoFolderPath,
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const clocConfig = {
            repoFolderPath,
            outDir,
            outClocFilePrefix: `${outFile}-`,
        };
        let _paths;
        (0, read_all_1.readAllParallel)(gitCommitConfig, clocConfig)
            .pipe((0, rxjs_1.tap)({
            next: (paths) => {
                paths.forEach((path) => {
                    (0, chai_1.expect)(path.length).gt(1);
                });
            },
        }), (0, rxjs_1.concatMap)((paths) => {
            _paths = paths;
            return (0, rxjs_1.forkJoin)(paths.map((path) => (0, observable_fs_1.readLinesObs)(path)));
        }), (0, rxjs_1.tap)({
            next: (linesReadArray) => {
                linesReadArray.forEach((linesRead) => {
                    (0, chai_1.expect)(linesRead.length).gt(1);
                });
            },
        }), (0, rxjs_1.concatMap)(() => {
            return (0, rxjs_1.forkJoin)(_paths.map((path) => (0, observable_fs_1.deleteFileObs)(path)));
        }))
            .subscribe();
    });
});
//# sourceMappingURL=read-all.spec.js.map