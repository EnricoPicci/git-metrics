import { expect } from "chai";
import { concatMap, last, take } from "rxjs";
import { readCommitCompact$ } from "../../../git-functions/commit.functions";
import { calculateClocGitDiffsChildParent } from "./commit-cloc-diff.function";


describe('calculateClocGitDiffsChildParent', () => {
    it(`should calculate the cloc diffs between the second commit of this repo and its parent, which is the first commit
    blanks, comments and nFiles statistics should be greater than 0 since we are passing parameters
    which say we do not want to remove them`, (done) => {
        const repoPath = '.';
        const languages = ['TypeScript'];
        const removeBlanks = false;
        const removeNFiles = false;
        const removeComment = false;

        readCommitCompact$(repoPath).pipe(
            take(2), // consider only the first two commits
            last(), // take the last commit which is the second commit
            concatMap(secondCommitCompact => {
                return calculateClocGitDiffsChildParent(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment)
            })
        )
            .subscribe({
                next: commitDiffStat => {
                    const TSStats = commitDiffStat.clocDiff.diffs.added.TypeScript;
                    expect(TSStats.blank).gt(0);
                    expect(TSStats.comment).gt(0);
                    expect(TSStats.code).gt(0);
                    expect(TSStats.nFiles).gt(0);
                },
                error: err => {
                    done(err);
                },
                complete: () => {
                    done();
                }
            })
    }).timeout(200000);
    it(`statistics about blanks, comments and nFiles should be undefined since we are passing parameters 
    that say we want to remove them`, (done) => {
        const repoPath = '.';
        const languages = ['TypeScript'];
        const removeBlanks = true;
        const removeNFiles = true;
        const removeComment = true;

        readCommitCompact$(repoPath).pipe(
            take(2), // consider only the first two commits
            last(), // take the last commit which is the second commit
            concatMap(secondCommitCompact => {
                return calculateClocGitDiffsChildParent(secondCommitCompact, repoPath, languages, removeBlanks, removeNFiles, removeComment)
            })
        )
            .subscribe({
                next: commitDiffStat => {
                    const TSStats = commitDiffStat.clocDiff.diffs.added.TypeScript;
                    expect(TSStats.blank).undefined;
                    expect(TSStats.comment).undefined;
                    expect(TSStats.code).gt(0);
                    expect(TSStats.nFiles).undefined;
                },
                error: err => {
                    done(err);
                },
                complete: () => {
                    done();
                }
            })
    }).timeout(200000);

});