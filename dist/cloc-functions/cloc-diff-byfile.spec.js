"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cloc_diff_byfile_1 = require("./cloc-diff-byfile");
const rxjs_1 = require("rxjs");
describe('clocDiffByfile$', () => {
    it(`should generate an Observable that emits a stream of ClocDiffByfile objects which represent the differences
    between 2 commits of this repo - we use one commit of this repo and compare it with its parent -
    the 2 commits differ in Javascript and Typescript files, but we consider only TypeScript files`, (done) => {
        const thirdCommitSha = 'b4bac5898b41d74be5c460564810278adb3d0782';
        const mostRecentCommit = thirdCommitSha;
        const leastRecentCommit = `${thirdCommitSha}^1`;
        const folderPath = './';
        const languages = ['TypeScript'];
        (0, cloc_diff_byfile_1.clocDiffByfile$)(mostRecentCommit, leastRecentCommit, folderPath, languages).pipe((0, rxjs_1.toArray)()).subscribe({
            next: (clocDiffs) => {
                (0, chai_1.expect)(clocDiffs).to.be.an('Array');
                (0, chai_1.expect)(clocDiffs.length).eq(10);
                clocDiffs.forEach(clocDiff => {
                    (0, chai_1.expect)(clocDiff).to.be.an('object');
                    (0, chai_1.expect)(clocDiff.blank_added).gte(0);
                    (0, chai_1.expect)(clocDiff.blank_removed).gte(0);
                    (0, chai_1.expect)(clocDiff.blank_same).gte(0);
                    (0, chai_1.expect)(clocDiff.blank_modified).gte(0);
                    (0, chai_1.expect)(clocDiff.code_added).gte(0);
                    (0, chai_1.expect)(clocDiff.code_removed).gte(0);
                    (0, chai_1.expect)(clocDiff.code_same).gte(0);
                    (0, chai_1.expect)(clocDiff.code_modified).gte(0);
                    (0, chai_1.expect)(clocDiff.comment_added).gte(0);
                    (0, chai_1.expect)(clocDiff.comment_removed).gte(0);
                    (0, chai_1.expect)(clocDiff.comment_same).gte(0);
                    (0, chai_1.expect)(clocDiff.comment_modified).gte(0);
                    (0, chai_1.expect)(clocDiff.extension).eq('ts');
                    (0, chai_1.expect)(clocDiff.file).to.be.a('string');
                    (0, chai_1.expect)(clocDiff.possibleCutPaste).eq(false);
                });
            },
            error: (error) => {
                done(error);
            },
            complete: () => {
                done();
            }
        });
    }).timeout(1000000);
});
//# sourceMappingURL=cloc-diff-byfile.spec.js.map