import { expect } from 'chai';
import path from 'path';
import { tap, toArray } from 'rxjs';
import { enrichedCommitsStream } from './commits';
import { addBranchTips, updateCurrentBranchTips } from './commits-and-branch-tips';

describe(`updateCurrentBranchTips`, () => {
    it(`add the commit if the currentBranchTips is empty, which should happen with the first commit`, () => {
        const firstCommitHash = 'hash for the first commit';
        const parentsOfTheNewCommit = [];
        const currentBranchTips = [];

        const { updatedBranchTips, isAdditionalBranchTip } = updateCurrentBranchTips(
            parentsOfTheNewCommit,
            currentBranchTips,
            firstCommitHash,
        );

        // since this is the first commit, then it enters in the lis of current tips and becomes a new tip
        expect(isAdditionalBranchTip).true;
        expect(updatedBranchTips.length).equal(1);
        expect(updatedBranchTips.includes(firstCommitHash)).true;
    });
    it(`remove a single parent from the list of current tips and adds the child`, () => {
        const newCommitHash = 'hash for commit child of commit 1';
        const parentHash = 'hash for commit 1';
        const parentsOfTheNewCommit = [parentHash];
        const anotherBranchTip = 'hash for another commit';
        const currentBranchTips = [parentHash, anotherBranchTip];

        const { updatedBranchTips, isAdditionalBranchTip } = updateCurrentBranchTips(
            parentsOfTheNewCommit,
            currentBranchTips,
            newCommitHash,
        );

        // since the parent is in the list of current tips, then the new commit that is passing its parents is not an additional tip
        // since it replaces its parents
        expect(isAdditionalBranchTip).false;
        expect(updatedBranchTips.length).equal(2);
        expect(updatedBranchTips.includes(newCommitHash)).true;
        expect(updatedBranchTips.includes(parentHash)).false;
        expect(updatedBranchTips.includes(anotherBranchTip)).true;
    });
    it(`the parent is not in the list of current tips and so is not removed, and the child is added to the list of current tips as a new tip`, () => {
        const newCommitHash = 'hash for commit child of commit 1';
        const parentHash = 'hash for commit 1';
        const currentBranchTip = 'hash for commit 2';
        const parentsOfTheNewCommit = [parentHash];
        const currentBranchTips = [currentBranchTip];

        const { updatedBranchTips, isAdditionalBranchTip } = updateCurrentBranchTips(
            parentsOfTheNewCommit,
            currentBranchTips,
            newCommitHash,
        );

        // since the parent is in NOT the list of current tips, then the new commit that is passing its parents IS AN additional tip
        // since it is added to the list without replacing any parent
        expect(isAdditionalBranchTip).true;
        expect(updatedBranchTips.length).equal(2);
        expect(updatedBranchTips.includes(newCommitHash)).true;
        expect(updatedBranchTips.includes(parentHash)).false;
        expect(updatedBranchTips.includes(currentBranchTip)).true;
    });
});

// Test commits info about the following scenario
//
//   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
//                         \                               \                     /                 \
//   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M--- commit 8 --M-- commit 9
//                                                           \                                                     /
//   Branch B                                                 \--- commit 4 --------------------------------------/
//
describe(`addBranchTips`, () => {
    it(`add branch info to a stream of commits`, (done) => {
        const commitLogName = 'a-project-with-git-branches-commits.gitlog';
        const clocLogName = 'a-project-with-git-branches-cloc.gitlog';
        const commitLogPath = path.join(process.cwd(), 'test-data', 'output', commitLogName);
        const clocLogPath = path.join(process.cwd(), 'test-data', 'output', clocLogName);

        const commitHashes: { [commitId: string]: string } = {};

        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                addBranchTips(),
                toArray(),
                tap({
                    next: (commits) => {
                        // the commits are 9 + 3, the 3 representing the merges
                        expect(commits.length).equal(12);
                        //
                        // the first commit is a new additional tip (actually the first one) and, at the time of the commit,
                        // there were just 1 tip of branches, i.e. the commit itself
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1
                        //
                        const commit_1 = commits[0];
                        expect(commit_1.isAdditionalBranchTip).true;
                        expect(commit_1.branchTips.length).equal(1);
                        expect(commit_1.branchTips.includes(commit_1.hashShort)).true;
                        commitHashes['commit 1'] = commit_1.hashShort;
                        //
                        // the second commit is not a new tip and the branch tips, at the time of this commit, are still 1
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\
                        //                       \
                        // Branch A               \----- commit 2
                        //
                        const commit_2 = commits[1];
                        expect(commit_2.isAdditionalBranchTip).false;
                        expect(commit_2.branchTips.length).equal(1);
                        expect(commit_2.branchTips.includes(commit_2.hashShort)).true;
                        commitHashes['commit 2'] = commit_2.hashShort;
                        //
                        // the third commit is a new tip and the branch tips, at the time of this commit, are now 2: one represented
                        // by commit 3 itself and one represented by commit 2
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\------------------- commit 3
                        //                       \
                        // Branch A               \----- commit 2
                        //
                        const commit_3 = commits[2];
                        expect(commit_3.isAdditionalBranchTip).true;
                        expect(commit_3.branchTips.length).equal(2);
                        expect(commit_3.branchTips.includes(commit_3.hashShort)).true;
                        expect(commit_3.branchTips.includes(commitHashes['commit 2'])).true;
                        commitHashes['commit 3'] = commit_3.hashShort;
                        //
                        // the fourth commit is not a new tip and the branch tips, at the time of this commit, are now 2: one represented
                        // by commit 4 itself and one represented by commit 2
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\------------------- commit 3 --\
                        //                       \                               \
                        // Branch A               \----- commit 2                 \
                        //                                                         \
                        // Branch B                                                 \--- commit 4
                        //
                        const commit_4 = commits[3];
                        expect(commit_4.isAdditionalBranchTip).false;
                        expect(commit_4.branchTips.length).equal(2);
                        expect(commit_4.branchTips.includes(commit_4.hashShort)).true;
                        expect(commit_4.branchTips.includes(commitHashes['commit 2'])).true;
                        commitHashes['commit 4'] = commit_4.hashShort;
                        //
                        // the fifth commit is not a new tip and the branch tips, at the time of this commit, are now 2: one represented
                        // by commit 5 itself and one represented by commit 4
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\------------------- commit 3 --\
                        //                       \                               \
                        // Branch A               \----- commit 2 ----------------\------- commit 5
                        //                                                         \
                        // Branch B                                                 \--- commit 4
                        //
                        const commit_5 = commits[4];
                        expect(commit_5.isAdditionalBranchTip).false;
                        expect(commit_5.branchTips.length).equal(2);
                        expect(commit_5.branchTips.includes(commit_5.hashShort)).true;
                        expect(commit_5.branchTips.includes(commitHashes['commit 4'])).true;
                        commitHashes['commit 5'] = commit_5.hashShort;
                        //
                        // the sixth commit is the merge of Branch A into master
                        // It is not a new tip since it is the continuation of 2 parents
                        // The branch tips, at the time of the merge, are now 2: one represented by the merge and one by commit 4
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\------------------- commit 3 --\-----------------------M
                        //                       \                               \                     /
                        // Branch A               \----- commit 2 ----------------\------- commit 5 --/
                        //                                                         \
                        // Branch B                                                 \--- commit 4
                        //
                        const commit_M_A_to_m = commits[5];
                        expect(commit_M_A_to_m.isAdditionalBranchTip).false;
                        expect(commit_M_A_to_m.branchTips.length).equal(2);
                        expect(commit_M_A_to_m.branchTips.includes(commit_M_A_to_m.hashShort)).true;
                        expect(commit_M_A_to_m.branchTips.includes(commitHashes['commit 4'])).true;
                        commitHashes['commit Merge A into master'] = commit_M_A_to_m.hashShort;
                        //
                        // the seventh commit is not a new tip and the branch tips, at the time of this commit, are now 2: one represented
                        // by commit 6 itself and one represented by commit 2
                        //
                        // Test commits info about the following scenario
                        //
                        // master ----commit 1--\------------------- commit 3 --\-----------------------/----commit 6
                        //                       \                               \                     /
                        // Branch A               \----- commit 2 ----------------\------- commit 5 --/
                        //                                                         \
                        // Branch B                                                 \--- commit 4
                        //
                        const commit_6 = commits[6];
                        expect(commit_6.isAdditionalBranchTip).false;
                        expect(commit_6.branchTips.length).equal(2);
                        expect(commit_6.branchTips.includes(commit_6.hashShort)).true;
                        expect(commit_6.branchTips.includes(commitHashes['commit 4'])).true;
                        commitHashes['commit 6'] = commit_6.hashShort;
                        //
                        // the 8th commit is a new tip and the branch tips, at the time of this commit, are now 3: one represented
                        // by commit 7 itself and the others represented by commit 4 and commit 6
                        //
                        // Test commits info about the following scenario
                        //
                        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6
                        //                         \                               \                     /
                        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/---------- commit 7
                        //                                                           \
                        //   Branch B                                                 \--- commit 4
                        //
                        const commit_7 = commits[7];
                        expect(commit_7.isAdditionalBranchTip).true;
                        expect(commit_7.branchTips.length).equal(3);
                        expect(commit_7.branchTips.includes(commit_7.hashShort)).true;
                        expect(commit_7.branchTips.includes(commitHashes['commit 4'])).true;
                        expect(commit_7.branchTips.includes(commitHashes['commit 6'])).true;
                        commitHashes['commit 7'] = commit_7.hashShort;
                        //
                        // This is a merge commit and is the merge of master into Branch A
                        // It is not a new tip since it is the continuation of 2 parents
                        // The branch tips, at the time of the merge, are now 2: one represented by the merge and one by commit 4
                        //
                        // Test commits info about the following scenario
                        //
                        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
                        //                         \                               \                     /                 \
                        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M
                        //                                                           \
                        //   Branch B                                                 \--- commit 4
                        //
                        const commit_M_master_to_A = commits[8];
                        expect(commit_M_master_to_A.isAdditionalBranchTip).false;
                        expect(commit_M_master_to_A.branchTips.length).equal(2);
                        expect(commit_M_master_to_A.branchTips.includes(commit_M_master_to_A.hashShort)).true;
                        expect(commit_M_master_to_A.branchTips.includes(commitHashes['commit 4'])).true;
                        commitHashes['commit Merge master into A'] = commit_M_master_to_A.hashShort;
                        //
                        // The commit 8 is not a new tip and the branch tips, at the time of this commit, are now 2: one represented
                        // by commit 8 itself and the other represented by commit 4
                        //
                        // Test commits info about the following scenario
                        //
                        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
                        //                         \                               \                     /                 \
                        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M--- commit 8
                        //                                                           \
                        //   Branch B                                                 \--- commit 4
                        //
                        const commit_8 = commits[9];
                        expect(commit_8.isAdditionalBranchTip).false;
                        expect(commit_8.branchTips.length).equal(2);
                        expect(commit_8.branchTips.includes(commit_8.hashShort)).true;
                        expect(commit_8.branchTips.includes(commitHashes['commit 4'])).true;
                        commitHashes['commit 8'] = commit_M_master_to_A.hashShort;
                        //
                        // This is a merge commit and is the merge of Branch B into Branch A
                        // It is not a new tip since it is the continuation of 2 parents
                        // The branch tips, at the time of the merge, are now 1: the one represented by the merge
                        //
                        // Test commits info about the following scenario
                        //
                        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
                        //                         \                               \                     /                 \
                        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M--- commit 8 --M
                        //                                                           \                                                     /
                        //   Branch B                                                 \--- commit 4 --------------------------------------/
                        //
                        const commit_M_B_to_A = commits[10];
                        expect(commit_M_B_to_A.isAdditionalBranchTip).false;
                        expect(commit_M_B_to_A.branchTips.length).equal(1);
                        expect(commit_M_B_to_A.branchTips.includes(commit_M_B_to_A.hashShort)).true;
                        commitHashes['commit Merge B into A'] = commit_M_master_to_A.hashShort;
                        //
                        // The commit 9 is not a new tip and the branch tips, at the time of this commit, is just one, the commit 9 itself
                        //
                        // Test commits info about the following scenario
                        //
                        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
                        //                         \                               \                     /                 \
                        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M--- commit 8 --M-- commit 9
                        //                                                           \                                                     /
                        //   Branch B                                                 \--- commit 4 --------------------------------------/
                        //
                        const commit_9 = commits[11];
                        expect(commit_9.isAdditionalBranchTip).false;
                        expect(commit_9.branchTips.length).equal(1);
                        expect(commit_9.branchTips.includes(commit_9.hashShort)).true;
                        commitHashes['commit 9'] = commit_9.hashShort;
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`adds the flag about the fact that a commit represents a branch or not`, (done) => {
        const commitLogName = 'a-project-with-git-branches-commits.gitlog';
        const clocLogName = 'a-project-with-git-branches-cloc.gitlog';
        const commitLogPath = path.join(process.cwd(), 'test-data', 'output', commitLogName);
        const clocLogPath = path.join(process.cwd(), 'test-data', 'output', clocLogName);

        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                addBranchTips(),
                toArray(),
                tap({
                    next: (commits) => {
                        // there are 3 merges
                        expect(commits.filter((c) => c.isMerge).length).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
