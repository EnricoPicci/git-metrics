"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cloc_diff_between_dates_1 = require("./cloc-diff-between-dates");
const rxjs_1 = require("rxjs");
describe('clocDiffBetweenDates$', () => {
    it(`should generate an Observable that emits a stream of ClocDiffByfileWithCommitDiffs objects which represent the differences
    between 2 commits of this repo at specific dates`, (done) => {
        const from = '2021-12-12';
        const to = '2023-05-05';
        const branchName = 'main';
        const folderPath = './';
        const languages = ['TypeScript'];
        (0, cloc_diff_between_dates_1.clocDiffBetweenDates$)(new Date(from), new Date(to), branchName, folderPath, '', languages).pipe((0, rxjs_1.toArray)()).subscribe({
            next: (clocDiffs) => {
                (0, chai_1.expect)(clocDiffs).to.be.an('Array');
                (0, chai_1.expect)(clocDiffs.length).eq(14);
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
//# sourceMappingURL=cloc-diff-between-dates.spec.js.map