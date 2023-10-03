"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const read_all_1 = require("./read-all");
describe(`readAllParallel`, () => {
    it(`performs all the read operations concurrently`, (done) => {
        const outDir = `${process.cwd()}/temp`;
        const outFile = 'read-all-concurrent';
        const gitCommitConfig = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const clocConfig = {
            folderPath: './src',
            outDir,
            outClocFilePrefix: `${outFile}-`,
        };
        let _paths;
        (0, read_all_1.readAllParallel)(gitCommitConfig, clocConfig)
            .pipe((0, rxjs_1.tap)({
            next: ([gitLogPath, clocByFilePath, clocSummaryPath]) => {
                (0, chai_1.expect)(gitLogPath.length).gt(0);
                (0, chai_1.expect)(clocByFilePath.length).gt(0);
                (0, chai_1.expect)(clocSummaryPath.length).gt(0);
            },
        }), (0, rxjs_1.concatMap)((paths) => {
            _paths = paths;
            return (0, rxjs_1.forkJoin)(paths.map((path) => (0, observable_fs_1.readLinesObs)(path)));
        }), (0, rxjs_1.tap)({
            next: (linesReadArray) => {
                // check that some lines have been written to the files
                linesReadArray.forEach((linesRead) => {
                    (0, chai_1.expect)(linesRead.length).gt(1);
                });
            },
        }), (0, rxjs_1.concatMap)(() => {
            return (0, rxjs_1.forkJoin)(_paths.map((path) => (0, observable_fs_1.deleteFileObs)(path))).pipe((0, rxjs_1.tap)(() => done()));
        }), (0, rxjs_1.catchError)((err) => {
            done(err);
            return (0, rxjs_1.of)(null);
        }))
            .subscribe();
    }).timeout(10000);
});
//# sourceMappingURL=read-all.spec.js.map