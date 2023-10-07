"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commit_functions_1 = require("../../../git-functions/commit.functions");
const commit_cloc_diff_function_1 = require("./commit-cloc-diff.function");
describe('calculateClocGitDiffsChildParent', () => {
    it(`should calculate the cloc diffs between the second commit of this repo and its parent, which is the first commit
    blanks, comments and nFiles statistics should be greater than 0 since we are passing parameters
    which say we do not want to remove them`, (done) => {
        const repoPath = '.';
        const languages = ['TypeScript'];
        const removeBlanks = false;
        const removeNFiles = false;
        const removeComment = false;
        (0, commit_functions_1.readCommitCompact$)(repoPath).pipe((0, rxjs_1.take)(2), // consider only the first two commits
        (0, rxjs_1.last)(), // take the last commit which is the second commit
        (0, rxjs_1.concatMap)(secondCommitCompact => {
            return (0, commit_cloc_diff_function_1.calculateClocGitDiffsChildParent)(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment);
        }))
            .subscribe({
            next: commitDiffStat => {
                const TSStats = commitDiffStat.clocDiff.diffs.added.TypeScript;
                (0, chai_1.expect)(TSStats.blank).gt(0);
                (0, chai_1.expect)(TSStats.comment).gt(0);
                (0, chai_1.expect)(TSStats.code).gt(0);
                (0, chai_1.expect)(TSStats.nFiles).gt(0);
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
        (0, commit_functions_1.readCommitCompact$)(repoPath).pipe((0, rxjs_1.take)(2), // consider only the first two commits
        (0, rxjs_1.last)(), // take the last commit which is the second commit
        (0, rxjs_1.concatMap)(secondCommitCompact => {
            return (0, commit_cloc_diff_function_1.calculateClocGitDiffsChildParent)(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment);
        }))
            .subscribe({
            next: commitDiffStat => {
                const TSStats = commitDiffStat.clocDiff.diffs.added.TypeScript;
                (0, chai_1.expect)(TSStats.blank).undefined;
                (0, chai_1.expect)(TSStats.comment).undefined;
                (0, chai_1.expect)(TSStats.code).gt(0);
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