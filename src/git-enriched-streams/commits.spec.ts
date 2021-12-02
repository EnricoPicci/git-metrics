import { expect } from 'chai';
import path = require('path');
import { toArray, tap } from 'rxjs';
import { commitsStream, enrichedCommitsStream, splitCommits } from './commits';

describe(`splitCommits`, () => {
    it(`returns a stream of arrays of strings, each array containing all the data related to a specific commit`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        splitCommits(logFilePath)
            .pipe(toArray())
            .subscribe({
                next: (commits) => {
                    expect(commits.length).equal(3);
                    // top commit
                    expect(commits[0].length).equal(3);
                    // middle commit
                    expect(commits[1].length).equal(2);
                    // bottom commit
                    expect(commits[2].length).equal(3);
                },
                complete: () => done(),
            });
    });
});

describe(`enrichedCommitsStream`, () => {
    const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
    const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
    it(`reads the commit and cloc info and generates a stream of commitDocs`, (done) => {
        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit and cloc info and generates a stream of commitDocs - considers only commits after a certain date`, (done) => {
        const after = new Date('2021-01-01');
        enrichedCommitsStream(commitLogPath, clocLogPath, after)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`commitsStream`, () => {
    it(`returns a stream of GitCommitEnriched objects - one file is of type png and therefore has a not defined number of lines added and deleted
    which is set to 0`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/a-git-repo-png-file-commits.gitlog');
        commitsStream(logFilePath).subscribe({
            next: (commits) => {
                commits.files.forEach((f) => {
                    expect(f.linesAdded).gte(0);
                    expect(f.linesDeleted).gte(0);
                });
            },
            complete: () => done(),
        });
    });
});
