import { expect } from "chai";
import { concatMap, map, toArray } from "rxjs";
import { readCommitCompact$ } from "../../../git-functions/commit.functions";
import { calculateClocGitDiffsChildParent } from "./commit-cloc-diff.function";


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

        readCommitCompact$(repoPath).pipe(
            toArray(),
            map(commits => {
                return commits.reverse()[2]
            }),
            concatMap(secondCommitCompact => {
                return calculateClocGitDiffsChildParent(
                    secondCommitCompact,
                    repoPath,
                    languages,
                    removeBlanks,
                    removeNFiles,
                    removeComment,
                    removeSame
                )
            })
        )
            .subscribe({
                next: commitDiffStat => {
                    const TSStatsAdded = commitDiffStat.clocDiff.diffs.added.TypeScript;
                    expect(TSStatsAdded.blank).equal(0);
                    expect(TSStatsAdded.comment).equal(0);
                    expect(TSStatsAdded.code).equal(0);
                    expect(TSStatsAdded.nFiles).equal(0);
                    const TSStatsModified = commitDiffStat.clocDiff.diffs.modified.TypeScript;
                    expect(TSStatsModified.blank).equal(0);
                    expect(TSStatsModified.comment).equal(0);
                    expect(TSStatsModified.code).equal(1);
                    expect(TSStatsModified.nFiles).equal(1);
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
        const removeSame = false;

        readCommitCompact$(repoPath).pipe(
            toArray(),
            map(commits => {
                return commits.reverse()[2]
            }),
            concatMap(secondCommitCompact => {
                return calculateClocGitDiffsChildParent(
                    secondCommitCompact,
                    repoPath,
                    languages,
                    removeBlanks,
                    removeNFiles,
                    removeComment,
                    removeSame
                )
            })
        )
            .subscribe({
                next: commitDiffStat => {
                    const TSStats = commitDiffStat.clocDiff.diffs.modified.TypeScript;
                    expect(TSStats.blank).undefined;
                    expect(TSStats.comment).undefined;
                    expect(TSStats.code).equal(1);
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