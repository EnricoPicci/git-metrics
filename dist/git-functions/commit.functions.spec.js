"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const commit_functions_1 = require("./commit.functions");
const rxjs_1 = require("rxjs");
describe('fetchCommits', () => {
    it('should throw an error if repoPath is not provided', () => {
        (0, chai_1.expect)(() => (0, commit_functions_1.fetchCommits)('')).to.throw();
    });
    it('should return a stream of commit objects from this repo', (done) => {
        (0, commit_functions_1.fetchCommits)('./').pipe((0, rxjs_1.toArray)()).subscribe((commits) => {
            (0, chai_1.expect)(commits instanceof Array).to.be.true;
            (0, chai_1.expect)(commits.length).greaterThan(0);
            const firstCommit = commits[commits.length - 1];
            (0, chai_1.expect)(firstCommit.sha).equal('8767d5864e7d72df0f25915fe8e0652244eee5fa');
            (0, chai_1.expect)(!!firstCommit.date).to.be.true;
            (0, chai_1.expect)(!!firstCommit.author).to.be.true;
            // this tests that the sha is a real sha and not something else
            const lastCommit = commits[0];
            (0, chai_1.expect)(lastCommit.sha.includes(' ')).to.be.false;
            done();
        });
    });
});
describe('fetchOneCommit', () => {
    it('should throw an error if an not existing sha is provided', (done) => {
        const notExistingCommitSha = 'abc';
        const repoPath = './';
        (0, commit_functions_1.fetchOneCommit)(notExistingCommitSha, repoPath, false).subscribe({
            next: () => {
                done('should not return a value');
            },
            error: (error) => {
                (0, chai_1.expect)(error instanceof Error).to.be.true;
                done();
            },
            complete: () => {
                done('should not complete');
            }
        });
    });
    it('should notify the first commit object of this repo', (done) => {
        const firstCommitOfThisRepo = '8767d5864e7d72df0f25915fe8e0652244eee5fa';
        const repoPath = './';
        (0, commit_functions_1.fetchOneCommit)(firstCommitOfThisRepo, repoPath, false).subscribe({
            next: (commitCompact) => {
                (0, chai_1.expect)(commitCompact.sha).equal(firstCommitOfThisRepo);
                done();
            },
            error: (error) => {
                done(error);
            },
        });
    });
});
//# sourceMappingURL=commit.functions.spec.js.map