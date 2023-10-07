"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commit_functions_1 = require("../../../git-functions/commit.functions");
const commit_cloc_diff_function_1 = require("./commit-cloc-diff.function");
describe('calculateClocGitDiffsChildParent', () => {
    it(`should calculate the cloc diffs between the third commit of this repo and its parent, which is the second commit.
    In this case, for TypeScript files, the values for added or removed stats are all 0, but there are statistics for
    modified files since one file has been modified in one row.`, (done) => {
        const repoPath = '.';
        const languages = ['TypeScript'];
        const removeBlanks = false;
        const removeNFiles = false;
        const removeComment = false;
        const removeSame = false;
        (0, commit_functions_1.readCommitCompact$)(repoPath).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(commits => {
            return commits.reverse()[2];
        }), (0, rxjs_1.concatMap)(secondCommitCompact => {
            return (0, commit_cloc_diff_function_1.calculateClocGitDiffsChildParent)(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment, removeSame);
        }))
            .subscribe({
            next: commitDiffStat => {
                const TSStatsAdded = commitDiffStat.clocDiff.diffs.added.TypeScript;
                (0, chai_1.expect)(TSStatsAdded.blank).equal(0);
                (0, chai_1.expect)(TSStatsAdded.comment).equal(0);
                (0, chai_1.expect)(TSStatsAdded.code).equal(0);
                (0, chai_1.expect)(TSStatsAdded.nFiles).equal(0);
                const TSStatsModified = commitDiffStat.clocDiff.diffs.modified.TypeScript;
                (0, chai_1.expect)(TSStatsModified.blank).equal(0);
                (0, chai_1.expect)(TSStatsModified.comment).equal(0);
                (0, chai_1.expect)(TSStatsModified.code).equal(1);
                (0, chai_1.expect)(TSStatsModified.nFiles).equal(1);
            },
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        });
    }).timeout(200000);
    it(`statistics about blanks, comments and nFiles should be undefined since we are passing parameters 
    that say we want to remove them`, (done) => {
        const repoPath = '.';
        const languages = ['TypeScript'];
        const removeBlanks = true;
        const removeNFiles = true;
        const removeComment = true;
        const removeSame = false;
        (0, commit_functions_1.readCommitCompact$)(repoPath).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(commits => {
            return commits.reverse()[2];
        }), (0, rxjs_1.concatMap)(secondCommitCompact => {
            return (0, commit_cloc_diff_function_1.calculateClocGitDiffsChildParent)(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment, removeSame);
        }))
            .subscribe({
            next: commitDiffStat => {
                const TSStats = commitDiffStat.clocDiff.diffs.modified.TypeScript;
                (0, chai_1.expect)(TSStats.blank).undefined;
                (0, chai_1.expect)(TSStats.comment).undefined;
                (0, chai_1.expect)(TSStats.code).equal(1);
                (0, chai_1.expect)(TSStats.nFiles).undefined;
            },
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        });
    }).timeout(200000);
});
//# sourceMappingURL=commit-cloc-diff.function.spec.js.map