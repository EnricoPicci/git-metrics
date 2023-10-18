import { tap, toArray } from "rxjs";
import { clocDiffWithCommit$ } from "./cloc-diff-commit";
import { expect } from "chai";

describe(`clocDiffWithCommit$`, () => {
    it(`calculates the differences between all commits in a certain timeframe for this repo`, (done) => {
        const pathToRepo = './'
        const fromDate = new Date('2023-10-11')
        const toDate = new Date('2023-10-12')

        clocDiffWithCommit$(pathToRepo, fromDate, toDate)
            .pipe(
                toArray(),
                tap({
                    next: (arrayOfClocDiffCommitEnriched) => {
                        expect(arrayOfClocDiffCommitEnriched.length).gt(0);

                        const commandTs = arrayOfClocDiffCommitEnriched.find(
                            (clocDiffCommitEnriched) => clocDiffCommitEnriched.file === ('src/lib/command.ts')
                        );
                        expect(commandTs).not.undefined;
                        expect(commandTs?.code).equal(29);
                        expect(commandTs?.blank).equal(8);
                        expect(commandTs?.comment).equal(0);
                        expect(commandTs?.code_added).equal(9);
                        expect(commandTs?.code_removed).equal(30);
                        expect(commandTs?.code_modified).equal(9);
                        expect(commandTs?.code_same).equal(10);
                        expect(commandTs?.blank_added).equal(4);
                        expect(commandTs?.blank_removed).equal(0);
                        expect(commandTs?.blank_modified).equal(0);
                        expect(commandTs?.blank_same).equal(0);
                        expect(commandTs?.comment_added).equal(0);
                        expect(commandTs?.comment_removed).equal(0);
                        expect(commandTs?.comment_modified).equal(0);
                        expect(commandTs?.comment_same).equal(0);
                        expect(commandTs?.possibleCutPaste).false;
                        expect(commandTs?.file).equal('src/lib/command.ts');

                        // this file was removed in the commit hence it should have 0 lines of code, blank and comment
                        const fileRemovedName = 'src/apps/cloc-on-repos/read-repos-commits/internals/read-repos-commits.ts'
                        const fileRemoved = arrayOfClocDiffCommitEnriched.find(
                            (clocDiffCommitEnriched) => clocDiffCommitEnriched.file === fileRemovedName
                        );
                        expect(fileRemoved).not.undefined;
                        expect(fileRemoved?.code).equal(0);
                        expect(fileRemoved?.blank).equal(0);
                        expect(fileRemoved?.comment).equal(0);
                    },
                }),
                toArray(),
                tap({
                    next: (commitRecords) => {
                        expect(commitRecords).not.undefined;
                        expect(commitRecords.length).gt(0);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});