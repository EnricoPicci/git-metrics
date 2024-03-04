import { expect } from "chai";
import { clocDiffBetweenDates$ } from "./cloc-diff-between-dates";
import { toArray } from "rxjs";

describe.only('clocDiffBetweenDates$', () => {
    it(`should generate an Observable that emits a stream of ClocDiffByfileWithCommitDiffs objects which represent the differences
    between 2 commits of this repo at specific dates`, (done) => {
        const from = '2021-12-12'
        const to = '2023-05-05'
        const branchName = 'main'
        const folderPath = './'
        const languages = ['TypeScript'];

        clocDiffBetweenDates$(new Date(from), new Date(to), branchName, folderPath, languages).pipe(
            toArray()
        ).subscribe({
            next: (clocDiffs) => {
                expect(clocDiffs).to.be.an('Array');
                expect(clocDiffs.length).eq(11);
                clocDiffs.forEach(clocDiff => {
                    expect(clocDiff).to.be.an('object');
                    expect(clocDiff.blank_added).gte(0);
                    expect(clocDiff.blank_removed).gte(0);
                    expect(clocDiff.blank_same).gte(0);
                    expect(clocDiff.blank_modified).gte(0);
                    expect(clocDiff.code_added).gte(0);
                    expect(clocDiff.code_removed).gte(0);
                    expect(clocDiff.code_same).gte(0);
                    expect(clocDiff.code_modified).gte(0);
                    expect(clocDiff.comment_added).gte(0);
                    expect(clocDiff.comment_removed).gte(0);
                    expect(clocDiff.comment_same).gte(0);
                    expect(clocDiff.comment_modified).gte(0);
                    expect(clocDiff.extension).eq('ts');
                    expect(clocDiff.file).to.be.a('string');
                    // test that the sum of the diffs of the commit contains numbers
                    expect(clocDiff.commit_code_added).gte(0);
                    expect(clocDiff.commit_code_removed).gte(0);
                    expect(clocDiff.commit_code_same).gte(0);
                    expect(clocDiff.commit_code_modified).gte(0);
                })
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