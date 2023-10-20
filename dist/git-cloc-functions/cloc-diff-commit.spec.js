"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const cloc_diff_commit_1 = require("./cloc-diff-commit");
const chai_1 = require("chai");
describe(`clocDiffWithCommit$`, () => {
    it(`calculates the differences between all commits in a certain timeframe for this repo`, (done) => {
        const pathToRepo = './';
        const fromDate = new Date('2023-10-11');
        const toDate = new Date('2023-10-12');
        (0, cloc_diff_commit_1.clocDiffWithCommit$)(pathToRepo, fromDate, toDate)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (arrayOfClocDiffCommitEnriched) => {
                (0, chai_1.expect)(arrayOfClocDiffCommitEnriched.length).gt(0);
                // take the first diff for a certain file - since it is the first one it is not going to change
                // over time since the git history is immutable - being sure that it does not change over time
                // allows us to write a test for it
                const diffsInCommandTsFile = arrayOfClocDiffCommitEnriched.filter((clocDiffCommitEnriched) => clocDiffCommitEnriched.file === ('src/lib/command.ts'));
                const commandTs = diffsInCommandTsFile[0];
                (0, chai_1.expect)(commandTs).not.undefined;
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.code_added).equal(9);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.code_removed).equal(30);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.code_modified).equal(9);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.code_same).equal(10);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.blank_added).equal(4);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.blank_removed).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.blank_modified).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.blank_same).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.comment_added).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.comment_removed).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.comment_modified).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.comment_same).equal(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.file).equal('src/lib/command.ts');
                // this file can mutate in terms of lines of code, blank and comment over time, hence we only
                // check that the values oc code, blank and comment are numbers 
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.code).gte(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.blank).gte(0);
                (0, chai_1.expect)(commandTs === null || commandTs === void 0 ? void 0 : commandTs.comment).gte(0);
                // this file was removed in the commit hence it should have 0 lines of code, blank and comment
                const fileRemovedName = 'src/apps/cloc-on-repos/read-repos-commits/internals/read-repos-commits.ts';
                const fileRemoved = arrayOfClocDiffCommitEnriched.find((clocDiffCommitEnriched) => clocDiffCommitEnriched.file === fileRemovedName);
                (0, chai_1.expect)(fileRemoved).not.undefined;
                (0, chai_1.expect)(fileRemoved === null || fileRemoved === void 0 ? void 0 : fileRemoved.code).equal(0);
                (0, chai_1.expect)(fileRemoved === null || fileRemoved === void 0 ? void 0 : fileRemoved.blank).equal(0);
                (0, chai_1.expect)(fileRemoved === null || fileRemoved === void 0 ? void 0 : fileRemoved.comment).equal(0);
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (commitRecords) => {
                (0, chai_1.expect)(commitRecords).not.undefined;
                (0, chai_1.expect)(commitRecords.length).gt(0);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`writeClocDiffWithCommit$`, () => {
    it(`calculates the differences between all commits in a certain timeframe for this repo and writes them to a csv file`, (done) => {
        const pathToRepo = './';
        const fromDate = new Date('2023-10-11');
        const toDate = new Date('2023-10-12');
        const outDir = './temp/';
        (0, cloc_diff_commit_1.writeClocDiffWithCommit$)(pathToRepo, outDir, fromDate, toDate)
            .pipe((0, rxjs_1.tap)({
            next: (csvFile) => {
                (0, chai_1.expect)(csvFile).to.be.a('string');
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=cloc-diff-commit.spec.js.map