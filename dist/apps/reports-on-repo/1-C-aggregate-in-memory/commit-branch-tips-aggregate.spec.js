"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const commits_and_branch_tips_1 = require("../1-B-git-enriched-streams/commits-and-branch-tips");
const read_all_1 = require("../1-A-read/read-all");
const commit_branch_tips_aggregate_1 = require("./commit-branch-tips-aggregate");
describe(`commitWithBranchTipsPerDayDictionary`, () => {
    it(`returns a dictionary with day as key and the array of commits for that day as value`, (done) => {
        const repoFolderPath = './';
        const filter = [];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits-2.log';
        const reverse = true;
        const commitOptions = { filter, outDir, repoFolderPath, outFile, reverse };
        const clocParams = { outDir, folderPath: repoFolderPath };
        const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, clocParams);
        const commitsWithBranchTips = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
        (0, commit_branch_tips_aggregate_1.commitWithBranchTipsPerDayDictionary)(commitsWithBranchTips)
            .pipe((0, rxjs_1.tap)({
            next: (commitPerDayDictionaryStruct) => {
                (0, chai_1.expect)(commitPerDayDictionaryStruct).not.undefined;
                (0, chai_1.expect)(Object.values(commitPerDayDictionaryStruct.dictionary).length).gt(0);
                (0, chai_1.expect)(commitPerDayDictionaryStruct.lastCommit).not.undefined;
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000000);
});
describe(`commitDaylySummary`, () => {
    it(`returns a dictionary with day as key and a summary of commits for that day as value`, (done) => {
        // Test the dayly summary of the commits info in the following scenario
        //
        //   master ----commit 1--\------------------- commit 3 --\-----------------------M---commit 6----\
        //                         \                               \                     /                 \
        //   Branch A               \----- commit 2 ----------------\------- commit 5 --/--------commit 7 --M--- commit 8 -----M-- commit 9
        //                                                           \                                                        /
        //   Branch B                                                 \--- commit 4 -----------------------------------------/
        //
        //                       day 1                            day 2                     day 3                       day 4           day 5
        const commitLogPath = './test-data/output/a-project-with-git-branches-commits.gitlog';
        const clocLogPath = './test-data/output/a-project-with-git-branches-cloc.gitlog';
        const commitsWithBranchTips = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
        (0, commit_branch_tips_aggregate_1.commitDaylySummary)(commitsWithBranchTips)
            .pipe((0, rxjs_1.tap)({
            next: (commitDaylySummaryDict) => {
                (0, chai_1.expect)(commitDaylySummaryDict).not.undefined;
                (0, chai_1.expect)(Object.values(commitDaylySummaryDict).length).equal(5);
                //
                const day_1 = '2021-11-01';
                const summaryDay_1 = commitDaylySummaryDict[day_1];
                // there if one commit maded in day 1
                (0, chai_1.expect)(summaryDay_1.numberOfCommits).equal(1);
                // the only commit made in day 1 represents also the 1 branch tip at the end of day 1
                (0, chai_1.expect)(summaryDay_1.branchTips.length).equal(1);
                // it is the first day with one branch tip, so there is 1 branch tip more than the previous day whene there were no commits
                (0, chai_1.expect)(summaryDay_1.deltaBranchTips).equal(1);
                // commit 1 will have one child
                (0, chai_1.expect)(summaryDay_1.numberOfBranchTipsWhichWillHaveChildren).equal(1);
                // no merges in day 1
                (0, chai_1.expect)(summaryDay_1.numberOfCommitsMergedInTheDay).equal(0);
                // all commits made in day 1 have children
                (0, chai_1.expect)(summaryDay_1.numberOfCommitsWithNoFutureChildren).equal(0);
                (0, chai_1.expect)(summaryDay_1.day).equal(day_1);
                (0, chai_1.expect)(summaryDay_1.commitHashes.length).equal(1);
                // there are no merges in day 1
                (0, chai_1.expect)(summaryDay_1.numberOfMerges).equal(0);
                (0, chai_1.expect)(summaryDay_1.linesAddDelForMerges).equal(0);
                //
                const day_2 = '2021-11-02';
                const summaryDay_2 = commitDaylySummaryDict[day_2];
                (0, chai_1.expect)(summaryDay_2.numberOfCommits).equal(2);
                // at the end of day 2 there are 2 branch tips, commit 2 and commit 3, which are commits with no children (at least no children up to end of day 2)
                (0, chai_1.expect)(summaryDay_2.branchTips.length).equal(2);
                // at the end of day 2 there is one commit more than at the end of day 1
                (0, chai_1.expect)(summaryDay_2.deltaBranchTips).equal(1);
                // both commit 2 and commit 3 will have some children in the future
                (0, chai_1.expect)(summaryDay_2.numberOfBranchTipsWhichWillHaveChildren).equal(2);
                (0, chai_1.expect)(summaryDay_2.numberOfCommitsMergedInTheDay).equal(0);
                // commit 2 and commit 3 all will have some children in the future so at the end of day 2 there are no commits with no future children
                (0, chai_1.expect)(summaryDay_2.numberOfCommitsWithNoFutureChildren).equal(0);
                (0, chai_1.expect)(summaryDay_2.day).equal(day_2);
                (0, chai_1.expect)(summaryDay_2.commitHashes.length).equal(2);
                // there are no merges in day 2
                (0, chai_1.expect)(summaryDay_2.numberOfMerges).equal(0);
                (0, chai_1.expect)(summaryDay_2.linesAddDelForMerges).equal(0);
                //
                const day_3 = '2021-11-03';
                const summaryDay_3 = commitDaylySummaryDict[day_3];
                // in day 3 we have 3 commits, commit 4 and commit 5 and the merge of Branch A into master
                (0, chai_1.expect)(summaryDay_3.numberOfCommits).equal(3);
                // at the end of day 3 there are 2 branch tips, commit 4 and the merge of Branch A into master
                (0, chai_1.expect)(summaryDay_3.branchTips.length).equal(2);
                // at the end of day 3 there is the same number of commits as at the end of day 2
                (0, chai_1.expect)(summaryDay_3.deltaBranchTips).equal(0);
                // both commit 4 and the merge will have some children in the future
                (0, chai_1.expect)(summaryDay_3.numberOfBranchTipsWhichWillHaveChildren).equal(2);
                (0, chai_1.expect)(summaryDay_3.numberOfCommitsMergedInTheDay).equal(1);
                // commit 4 and the merge will have some children in the future so at the end of day 3 there are no commits with no future children
                (0, chai_1.expect)(summaryDay_3.numberOfCommitsWithNoFutureChildren).equal(0);
                (0, chai_1.expect)(summaryDay_3.day).equal(day_3);
                (0, chai_1.expect)(summaryDay_3.commitHashes.length).equal(3);
                // there is 1 merge in day 3
                (0, chai_1.expect)(summaryDay_3.numberOfMerges).equal(1);
                (0, chai_1.expect)(summaryDay_3.linesAddDelForMerges).equal(18);
                //
                const day_4 = '2021-11-04';
                const summaryDay_4 = commitDaylySummaryDict[day_4];
                // in day 4 we have 4 commits, commit 6 and commit 7 and the merge of master into Branch A and commit 8
                (0, chai_1.expect)(summaryDay_4.numberOfCommits).equal(4);
                // at the end of day 4 there are 2 branch tips, commit 4 and commit 8
                (0, chai_1.expect)(summaryDay_4.branchTips.length).equal(2);
                // at the end of day 4 there is the same number of commits as at the end of day 3
                (0, chai_1.expect)(summaryDay_4.deltaBranchTips).equal(0);
                // both commit 4 and commit 8 will have some children in the future
                (0, chai_1.expect)(summaryDay_4.numberOfBranchTipsWhichWillHaveChildren).equal(2);
                (0, chai_1.expect)(summaryDay_4.numberOfCommitsMergedInTheDay).equal(1);
                // commit 4 and commit 8 will have some children in the future so at the end of day 4 there are no commits with no future children
                (0, chai_1.expect)(summaryDay_4.numberOfCommitsWithNoFutureChildren).equal(0);
                (0, chai_1.expect)(summaryDay_4.day).equal(day_4);
                (0, chai_1.expect)(summaryDay_4.commitHashes.length).equal(4);
                (0, chai_1.expect)(summaryDay_4.linesAdded).equal(45);
                (0, chai_1.expect)(summaryDay_4.linesDeleted).equal(2);
                (0, chai_1.expect)(summaryDay_4.linesAddDel).equal(47);
                // there is 1 merge in day 4
                (0, chai_1.expect)(summaryDay_4.numberOfMerges).equal(1);
                (0, chai_1.expect)(summaryDay_4.linesAddDelForMerges).equal(26);
                //
                const day_5 = '2021-11-05';
                const summaryDay_5 = commitDaylySummaryDict[day_5];
                // in day 5 we have 2 commits, the merge of Branch B into Branch A and commit 9
                (0, chai_1.expect)(summaryDay_5.numberOfCommits).equal(2);
                // at the end of day 5 there is 1 branch tips, commit 9
                (0, chai_1.expect)(summaryDay_5.branchTips.length).equal(1);
                // at the end of day 5 there is -1 number of commits as at the end of day 4
                (0, chai_1.expect)(summaryDay_5.deltaBranchTips).equal(-1);
                // commit 9 is the last commit and therefore can not have any child
                (0, chai_1.expect)(summaryDay_5.numberOfBranchTipsWhichWillHaveChildren).equal(0);
                (0, chai_1.expect)(summaryDay_5.numberOfCommitsMergedInTheDay).equal(1);
                // commit 9 is the last commit and therefore can not have any child
                (0, chai_1.expect)(summaryDay_5.numberOfCommitsWithNoFutureChildren).equal(1);
                (0, chai_1.expect)(summaryDay_5.day).equal(day_5);
                (0, chai_1.expect)(summaryDay_5.commitHashes.length).equal(2);
                // there is 1 merge in day 5
                (0, chai_1.expect)(summaryDay_5.numberOfMerges).equal(1);
                (0, chai_1.expect)(summaryDay_5.linesAddDelForMerges).equal(10);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000000);
    it(`returns a dictionary with day as key and a summary of commits for that day as value`, (done) => {
        const repoFolderPath = './';
        const filter = [];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits-2.log';
        const reverse = true;
        const commitOptions = { filter, outDir, repoFolderPath, outFile, reverse };
        const clocParams = { outDir, folderPath: repoFolderPath };
        const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, clocParams);
        const commitsWithBranchTips = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
        (0, commit_branch_tips_aggregate_1.commitDaylySummary)(commitsWithBranchTips)
            .pipe((0, rxjs_1.tap)({
            next: (commitDaylySummaryDict) => {
                (0, chai_1.expect)(commitDaylySummaryDict).not.undefined;
                (0, chai_1.expect)(Object.values(commitDaylySummaryDict).length).gt(0);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000000);
});
//# sourceMappingURL=commit-branch-tips-aggregate.spec.js.map