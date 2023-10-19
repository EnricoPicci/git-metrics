import { expect } from "chai";
import { clocDiffByfile$ } from "./cloc-diff-byfile";
import { toArray } from "rxjs";

describe('clocDiffByfile$', () => {
    it(`should generate an Observable that emits a stream of ClocDiffByfile objects which represent the differences
    between 2 commits of this repo - we use one commit of this repo and compare it with its parent -
    the 2 commits differ in Javascript and Typescript files, but we consider only TypeScript files`, (done) => {
        const thirdCommitSha = 'b4bac5898b41d74be5c460564810278adb3d0782'
        const mostRecentCommit = thirdCommitSha;
        const leastRecentCommit = `${thirdCommitSha}^1`;
        const folderPath = './'
        const languages = ['TypeScript'];

        clocDiffByfile$(mostRecentCommit, leastRecentCommit, folderPath, languages).pipe(
            toArray()
        ).subscribe({
            next: (clocDiffs) => {
                expect(clocDiffs).to.be.an('Array');
                expect(clocDiffs.length).eq(10);
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
                    expect(clocDiff.possibleCutPaste).eq(false);
                    // test that the sum of the diffs contains numbers
                    expect(clocDiff.sumOfDiffs).to.be.an('object');
                    expect(clocDiff.sumOfDiffs?.code_added).gte(0);
                    // test that the sum of the diffs is the same object for all diffs
                    expect(clocDiff.sumOfDiffs).eq(clocDiffs[0].sumOfDiffs);
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