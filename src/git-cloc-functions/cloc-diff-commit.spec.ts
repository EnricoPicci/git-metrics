import { tap, toArray } from "rxjs";
import { clocDiffWithAllCommits$, writeClocDiffWithCommit$ } from "./cloc-diff-commit";
import { expect } from "chai";

describe(`clocDiffWithAllCommits$`, () => {
    it(`calculates the differences between all commits in a certain timeframe for this repo`, (done) => {
        const pathToRepo = './'
        const fromDate = new Date('2023-10-11')
        const toDate = new Date('2023-10-13')

        clocDiffWithAllCommits$(pathToRepo, fromDate, toDate)
            .pipe(
                toArray(),
                tap({
                    next: (arrayOfClocDiffCommitEnriched) => {
                        expect(arrayOfClocDiffCommitEnriched.length).gt(0);
                        // in the period considered there the file src/lib/command.ts has been modified only once
                        // therefore there should be only one diff for this file.
                        // The diff belongs to this commit
                        // https://github.com/EnricoPicci/git-metrics/commit/ce8ccf86c9dd954c2210bb1f2171bc827bb2566a
                        // see image at assets/images/git-diff-command.ts.png
                        // the clocc git diffs are calculated by the cloc command - if we change the parameters (e.g. 
                        // if --ignore-whitespaces is added) the results can be different
                        const diffsInCommandTsFile = arrayOfClocDiffCommitEnriched.filter(
                            (clocDiffCommitEnriched) => clocDiffCommitEnriched.file === ('src/lib/command.ts')
                        );
                        expect(diffsInCommandTsFile.length).equal(1);
                        const commandTs = diffsInCommandTsFile[0];
                        expect(commandTs).not.undefined;
                        // for reasons not very well understood, for the same commit we can have 2 different results
                        // therefore the assertions consider both cases
                        const codeAdded = commandTs?.code_added;
                        expect(codeAdded).equal(1);
                        const codeRemoved = commandTs?.code_removed;
                        expect(codeRemoved).equal(0);
                        const codeModified = commandTs?.code_modified;
                        expect(codeModified).equal(1);
                        const codeSame = commandTs?.code_same;
                        expect(codeSame).equal(27);
                        const blankAdded = commandTs?.blank_added;
                        expect(blankAdded).equal(1);
                        expect(commandTs?.blank_removed).equal(0);
                        expect(commandTs?.blank_modified).equal(0);
                        expect(commandTs?.blank_same).equal(0);
                        expect(commandTs?.comment_added).equal(0);
                        expect(commandTs?.comment_removed).equal(0);
                        expect(commandTs?.comment_modified).equal(0);
                        expect(commandTs?.comment_same).equal(0);
                        expect(commandTs?.file).equal('src/lib/command.ts');
                        // the code, blank and comment fields are calculated based on the current state of the file
                        // this file can mutate over time in terms of lines of code, blank and comment, hence we only
                        // check that the values of code, blank and comment are numbers 
                        expect(commandTs?.code).gte(0);
                        expect(commandTs?.blank).gte(0);
                        expect(commandTs?.comment).gte(0);
                        // test that isCopy is false
                        expect(commandTs?.isCopy).equal(false);
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

    it(`if a file has been cancelled in the period considered, is should be found in the differences but should
    not have values for code, comments and blanks`, (done) => {
        const pathToRepo = './'
        const fromDate = new Date('2023-10-23')
        const toDate = new Date('2023-10-25')

        clocDiffWithAllCommits$(pathToRepo, fromDate, toDate)
            .pipe(
                toArray(),
                tap({
                    next: (arrayOfClocDiffCommitEnriched) => {
                        // this file was removed in the period considered in the commit 97cf7ebcecc0de1e321b62b89783360b8c586054
                        // hence it should have 0 lines of code, blank and comment
                        // WARNING: the commit 97cf7ebcecc0de1e321b62b89783360b8c586054 has 3 deleted files but the command
                        // cloc --git-diff-rel --by-file --csv 97cf7ebcecc0de1e321b62b89783360b8c586054^1 97cf7ebcecc0de1e321b62b89783360b8c586054
                        // returns only 'src/config-copy-yy.ts'
                        // while the command
                        // git diff --numstat 97cf7ebcecc0de1e321b62b89783360b8c586054^1 97cf7ebcecc0de1e321b62b89783360b8c586054
                        // shows all 3
                        const fileRemovedName = 'src/config-copy-yy.ts'
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