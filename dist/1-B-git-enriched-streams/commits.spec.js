"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const rxjs_1 = require("rxjs");
const commits_1 = require("./commits");
describe(`splitCommits`, () => {
    it(`returns a stream of arrays of strings, each array containing all the data related to a specific commit`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        (0, commits_1.splitCommits)(logFilePath)
            .pipe((0, rxjs_1.toArray)())
            .subscribe({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).equal(3);
                // top commit
                (0, chai_1.expect)(commits[0].length).equal(3);
                // middle commit
                (0, chai_1.expect)(commits[1].length).equal(2);
                // bottom commit
                (0, chai_1.expect)(commits[2].length).equal(3);
            },
            complete: () => done(),
        });
    });
});
describe(`enrichedCommitsStream`, () => {
    const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
    const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
    it(`reads the commit and cloc info and generates a stream of commitDocs`, (done) => {
        (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath)
            .pipe((0, rxjs_1.tap)({
            next: (commit) => {
                (0, chai_1.expect)(commit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allCommits) => {
                (0, chai_1.expect)(allCommits.length).equal(3);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`reads the commit and cloc info and generates a stream of commitDocs - considers only commits after a certain date`, (done) => {
        const after = new Date('2021-01-01');
        (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath, after)
            .pipe((0, rxjs_1.tap)({
            next: (commit) => {
                (0, chai_1.expect)(commit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allCommits) => {
                (0, chai_1.expect)(allCommits.length).equal(1);
            },
        }))
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
        (0, commits_1.commitsStream)(logFilePath).subscribe({
            next: (commits) => {
                commits.files.forEach((f) => {
                    (0, chai_1.expect)(f.linesAdded).gte(0);
                    (0, chai_1.expect)(f.linesDeleted).gte(0);
                });
            },
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=commits.spec.js.map