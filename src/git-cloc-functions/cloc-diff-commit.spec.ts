import { tap, toArray } from "rxjs";
import { clocDiffWithCommit$, writeClocDiffWithCommit$ } from "./cloc-diff-commit";
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

                        // take the first diff for a certain file - since it is the first one it is not going to change
                        // over time since the git history is immutable - being sure that it does not change over time
                        // allows us to write a test for it
                        const diffsInCommandTsFile = arrayOfClocDiffCommitEnriched.filter(
                            (clocDiffCommitEnriched) => clocDiffCommitEnriched.file === ('src/lib/command.ts')
                        );
                        const commandTs = diffsInCommandTsFile[0];
                        expect(commandTs).not.undefined;
                        expect(commandTs?.code).equal(31);
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

describe(`writeClocDiffWithCommit$`, () => {
    it(`calculates the differences between all commits in a certain timeframe for this repo and writes them to a csv file`, (done) => {
        const pathToRepo = './'
        const fromDate = new Date('2023-10-11')
        const toDate = new Date('2023-10-12')
        const outDir = './temp/'

        writeClocDiffWithCommit$(pathToRepo, outDir, fromDate, toDate)
            .pipe(
                tap({
                    next: (csvFile) => {
                        expect(csvFile).to.be.a('string');
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});