import { expect } from 'chai';

import { from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { couplingDict, couplingList, filterFilesWithMinNumOfCommits } from './file-coupling-aggregate';

import { testCommits_3, testCommits_5 } from './file-coupling-aggregate.test-data';

// builds a dictionary where for each file which is present in at least one commit, there is the info about how many commits
// it was present in and how many times it was there together with the other files
describe(`couplingDict`, () => {
    it(`Uses 3 commits with 3 different files`, (done) => {
        const commits = from(testCommits_3);
        couplingDict(commits)
            .pipe(
                tap((result) => {
                    expect(result).not.undefined;
                    expect(result.totNumberOfCommits).equal(3);
                    const coupDict = result.couplingDict;
                    expect(Object.values(coupDict).length).equal(3);
                    const f1 = coupDict['f1'];
                    expect(f1).not.undefined;
                    expect(f1.totCommitForFile).equal(3);
                    expect(f1.linesAdded).equal(9);
                    expect(f1.linesDeleted).equal(6);
                    expect(Object.values(f1.togetherWith).length).equal(2);
                    expect(f1.togetherWith['f2'].howManyTimes).equal(2);
                    expect(f1.togetherWith['f3'].howManyTimes).equal(1);
                    //
                    const f2 = coupDict['f2'];
                    expect(f2).not.undefined;
                    expect(f2.totCommitForFile).equal(2);
                    expect(Object.values(f2.togetherWith).length).equal(2);
                    expect(f2.togetherWith['f1'].howManyTimes).equal(2);
                    expect(f2.togetherWith['f3'].howManyTimes).equal(1);
                    //
                    const f3 = coupDict['f3'];
                    expect(f3).not.undefined;
                    expect(f3.totCommitForFile).equal(1);
                    expect(Object.values(f3.togetherWith).length).equal(2);
                    expect(f3.togetherWith['f1'].howManyTimes).equal(1);
                    expect(f3.togetherWith['f2'].howManyTimes).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`Uses 5 commits with 4 different files`, (done) => {
        const commits = from(testCommits_5);
        couplingDict(commits)
            .pipe(
                tap((result) => {
                    expect(result).not.undefined;
                    expect(result.totNumberOfCommits).equal(5);
                    const coupDict = result.couplingDict;
                    expect(Object.values(coupDict).length).equal(4);
                    const f1 = coupDict['f1'];
                    expect(f1).not.undefined;
                    expect(f1.totCommitForFile).equal(4);
                    expect(Object.values(f1.togetherWith).length).equal(3);
                    expect(f1.togetherWith['f2'].howManyTimes).equal(2);
                    expect(f1.togetherWith['f3'].howManyTimes).equal(1);
                    expect(f1.togetherWith['fA'].howManyTimes).equal(1);
                    //
                    const f2 = coupDict['f2'];
                    expect(f2).not.undefined;
                    expect(f2.totCommitForFile).equal(2);
                    expect(Object.values(f2.togetherWith).length).equal(2);
                    expect(f2.togetherWith['f1'].howManyTimes).equal(2);
                    expect(f2.togetherWith['f3'].howManyTimes).equal(1);
                    //
                    const f3 = coupDict['f3'];
                    expect(f3).not.undefined;
                    expect(f3.totCommitForFile).equal(1);
                    expect(Object.values(f3.togetherWith).length).equal(2);
                    expect(f3.togetherWith['f1'].howManyTimes).equal(1);
                    expect(f3.togetherWith['f2'].howManyTimes).equal(1);
                    //
                    const fA = coupDict['fA'];
                    expect(fA).not.undefined;
                    expect(fA.totCommitForFile).equal(2);
                    expect(Object.values(fA.togetherWith).length).equal(1);
                    expect(fA.togetherWith['f1'].howManyTimes).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`couplingList`, () => {
    it(`Uses 3 commits with 3 different files`, (done) => {
        const commits = from(testCommits_3);
        couplingDict(commits)
            .pipe(
                couplingList(),
                tap(({ listOfCouplings, numberOfCommitsForAllFiles }) => {
                    expect(numberOfCommitsForAllFiles.length).equal(3);
                    [3, 2, 1].forEach((n) =>
                        expect(numberOfCommitsForAllFiles.filter((nCommits) => nCommits === n).length).equal(1),
                    );
                    expect(listOfCouplings).not.undefined;
                    // all entries have the same info about the total number of commits
                    listOfCouplings.forEach((e) => expect(e.totNumberOfCommits).equal(3));
                    //
                    const f1_entries = listOfCouplings.filter((l) => l.path == 'f1');
                    expect(f1_entries.length).equal(2);
                    f1_entries.forEach((e) => expect(e.totCommitForFile).equal(3));
                    f1_entries.forEach((e) => expect(e.linesAdded).equal(9));
                    f1_entries.forEach((e) => expect(e.linesDeleted).equal(6));
                    // test the coupling between f1 and f2
                    expect(f1_entries.filter((e) => e.coupledFile === 'f2').length).equal(1);
                    const f1_f2_coupling = f1_entries.find((e) => e.coupledFile === 'f2');
                    expect(f1_f2_coupling.howManyTimes).equal(2);
                    expect(f1_f2_coupling.totCommitsForCoupledFile).equal(2);
                    //
                    const f2_entries = listOfCouplings.filter((l) => l.path == 'f2');
                    expect(f2_entries.length).equal(2);
                    f2_entries.forEach((e) => expect(e.totCommitForFile).equal(2));
                    f2_entries.forEach((e) => expect(e.linesAdded).equal(6));
                    f2_entries.forEach((e) => expect(e.linesDeleted).equal(4));
                    // test the coupling between f2 and f1
                    expect(f2_entries.filter((e) => e.coupledFile === 'f1').length).equal(1);
                    const f2_f1_coupling = f2_entries.find((e) => e.coupledFile === 'f1');
                    expect(f2_f1_coupling.howManyTimes).equal(2);
                    expect(f2_f1_coupling.totCommitsForCoupledFile).equal(3);
                    //
                    const f3_entries = listOfCouplings.filter((l) => l.path == 'f3');
                    expect(f3_entries.length).equal(2);
                    f3_entries.forEach((e) => expect(e.totCommitForFile).equal(1));
                    f3_entries.forEach((e) => expect(e.linesAdded).equal(3));
                    f3_entries.forEach((e) => expect(e.linesDeleted).equal(2));
                    // test the coupling between f3 and f2
                    expect(f3_entries.filter((e) => e.coupledFile === 'f1').length).equal(1);
                    const f3_f2_coupling = f3_entries.find((e) => e.coupledFile === 'f2');
                    expect(f3_f2_coupling.howManyTimes).equal(1);
                    expect(f3_f2_coupling.totCommitsForCoupledFile).equal(2);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`Uses 5 commits with 4 different files`, (done) => {
        const commits = from(testCommits_5);
        couplingDict(commits)
            .pipe(
                couplingList(),
                tap(({ listOfCouplings, numberOfCommitsForAllFiles }) => {
                    expect(numberOfCommitsForAllFiles.length).equal(4);
                    [4, 1].forEach((n) =>
                        expect(numberOfCommitsForAllFiles.filter((nCommits) => nCommits === n).length).equal(1),
                    );
                    // 2 files show a number of commits equal to 2
                    expect(numberOfCommitsForAllFiles.filter((nCommits) => nCommits === 2).length).equal(2);
                    expect(listOfCouplings).not.undefined;
                    // all entries have the same info about the total number of commits
                    listOfCouplings.forEach((e) => expect(e.totNumberOfCommits).equal(5));
                    //
                    const f1_entries = listOfCouplings.filter((l) => l.path == 'f1');
                    expect(f1_entries.length).equal(3);
                    f1_entries.forEach((e) => expect(e.totCommitForFile).equal(4));
                    f1_entries.forEach((e) => expect(e.linesAdded).equal(12));
                    f1_entries.forEach((e) => expect(e.linesDeleted).equal(8));
                    // test the coupling between f1 and fA
                    expect(f1_entries.filter((e) => e.coupledFile === 'fA').length).equal(1);
                    const f1_fA_coupling = f1_entries.find((e) => e.coupledFile === 'fA');
                    expect(f1_fA_coupling.howManyTimes).equal(1);
                    expect(f1_fA_coupling.totCommitsForCoupledFile).equal(2);
                    //
                    const f2_entries = listOfCouplings.filter((l) => l.path == 'f2');
                    expect(f2_entries.length).equal(2);
                    f2_entries.forEach((e) => expect(e.totCommitForFile).equal(2));
                    f2_entries.forEach((e) => expect(e.linesAdded).equal(6));
                    f2_entries.forEach((e) => expect(e.linesDeleted).equal(4));
                    // test the coupling between f2 and f1
                    expect(f2_entries.filter((e) => e.coupledFile === 'f1').length).equal(1);
                    const f2_f1_coupling = f2_entries.find((e) => e.coupledFile === 'f1');
                    expect(f2_f1_coupling.howManyTimes).equal(2);
                    expect(f2_f1_coupling.totCommitsForCoupledFile).equal(4);
                    //
                    const f3_entries = listOfCouplings.filter((l) => l.path == 'f3');
                    expect(f3_entries.length).equal(2);
                    f3_entries.forEach((e) => expect(e.totCommitForFile).equal(1));
                    f3_entries.forEach((e) => expect(e.linesAdded).equal(3));
                    f3_entries.forEach((e) => expect(e.linesDeleted).equal(2));
                    // test the coupling between f3 and f2
                    expect(f3_entries.filter((e) => e.coupledFile === 'f1').length).equal(1);
                    const f3_f2_coupling = f3_entries.find((e) => e.coupledFile === 'f2');
                    expect(f3_f2_coupling.howManyTimes).equal(1);
                    expect(f3_f2_coupling.totCommitsForCoupledFile).equal(2);
                    //
                    const fA_entries = listOfCouplings.filter((l) => l.path == 'fA');
                    expect(fA_entries.length).equal(1);
                    fA_entries.forEach((e) => expect(e.totCommitForFile).equal(2));
                    fA_entries.forEach((e) => expect(e.linesAdded).equal(2));
                    fA_entries.forEach((e) => expect(e.linesDeleted).equal(0));
                    // test the coupling between f3 and f2
                    expect(fA_entries.filter((e) => e.coupledFile === 'f1').length).equal(1);
                    const fA_f1_coupling = fA_entries.find((e) => e.coupledFile === 'f1');
                    expect(fA_f1_coupling.howManyTimes).equal(1);
                    expect(fA_f1_coupling.totCommitsForCoupledFile).equal(4);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`filterFilesWithMinNumOfCommits`, () => {
    it(`Sets a low depth for the coupling report`, (done) => {
        const commits = from(testCommits_5);
        couplingDict(commits)
            .pipe(
                couplingList(),
                filterFilesWithMinNumOfCommits(3),
                tap((listOfCouplings) => {
                    expect(listOfCouplings).not.undefined;
                    // the list of couplings returned has 4 elements since the depth in files coupling is set to 3
                    // the reson is that the number of commits in descending order for the data in this test is [4, 2, 2, 1]
                    // meaning  that there is a file with 4 commits, 2 files with 2 commits and 1 file with 1 commit
                    // since the depth is set to 3, the threshold of number of commits considered is the third element of the sorted list
                    // of number of commits which in this case is 2.
                    // Therefore we consider all entries in the list where both coupled files have at least 2 commits, i.e. all entries which
                    // show any comination of f1, f2 and fA (which are the files with at least 2 commits)
                    expect(listOfCouplings.length).equal(4);
                    const expectedFiles = ['f1', 'f2', 'fA'];
                    listOfCouplings.forEach((coupling) => expect(expectedFiles.includes(coupling.path)));
                    listOfCouplings.forEach((coupling) => expect(expectedFiles.includes(coupling.coupledFile)));
                    const f1_fA_coupling = listOfCouplings.find(
                        (coupling) => coupling.path === 'f1' && coupling.coupledFile === 'fA',
                    );
                    expect(f1_fA_coupling.howManyTimes_vs_totCommits).equals(50);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
