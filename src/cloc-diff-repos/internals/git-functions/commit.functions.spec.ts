import { expect } from 'chai';
import { newCommitsByMonth, fetchCommits, fetchOneCommit } from './commit.functions';
import { CommitCompact, CommitsByMonths } from './commit.model';
import { toArray } from 'rxjs';

// #copilot - these tests have been generated by copilot, not perfet but reasonably well structured
describe('commitsByMonth', () => {
    it('should group commits by month and year', () => {
        const commits: CommitCompact[] = [
            { sha: '123', date: new Date('2021-01-01'), author: 'author1' },
            { sha: '456', date: new Date('2021-01-15'), author: 'author2' },
            { sha: '789', date: new Date('2021-02-01'), author: 'author1' },
            { sha: 'abc', date: new Date('2021-02-15'), author: 'author3' },
            { sha: 'def', date: new Date('2021-03-01'), author: 'author1' },
        ]
        const expected: CommitsByMonths = {
            '2021-01': {
                commits: [
                    { sha: '123', date: new Date('2021-01-01'), author: 'author1' },
                    { sha: '456', date: new Date('2021-01-15'), author: 'author2' },
                ],
                authors: new Set(['author1', 'author2'])
            },
            '2021-02': {
                commits: [
                    { sha: '789', date: new Date('2021-02-01'), author: 'author1' },
                    { sha: 'abc', date: new Date('2021-02-15'), author: 'author3' },
                ],
                authors: new Set(['author1', 'author3'])
            },
            '2021-03': {
                commits: [
                    { sha: 'def', date: new Date('2021-03-01'), author: 'author1' },
                ],
                authors: new Set(['author1'])
            },
        }
        Object.entries(expected).forEach(([key, value]) => {
            expect(newCommitsByMonth(commits)[key]).deep.equal(value)
        })
    })

    it('should return an empty object for an empty array', () => {
        const commits: CommitCompact[] = []
        const expected = {}
        expect(newCommitsByMonth(commits)).deep.equal(expected)
    })
})

describe('fetchCommits', () => {
    it('should throw an error if repoPath is not provided', () => {
        expect(() => fetchCommits('')).to.throw()
    });

    it('should return a stream of commit objects from this repo', (done) => {
        fetchCommits('./').pipe(
            toArray()
        ).subscribe((commits) => {
            expect(commits instanceof Array).to.be.true;
            expect(commits.length).greaterThan(0);
            const firstCommit = commits[commits.length - 1];
            expect(firstCommit.sha).equal('8767d5864e7d72df0f25915fe8e0652244eee5fa');
            expect(!!firstCommit.date).to.be.true;
            expect(!!firstCommit.author).to.be.true;

            // this tests that the sha is a real sha and not something else
            const lastCommit = commits[0];
            expect(lastCommit.sha.includes(' ')).to.be.false;
            done();
        });
    });
});

describe('fetchOneCommit', () => {
    it('should throw an error if an not existing sha is provided', (done) => {
        const notExistingCommitSha = 'abc'
        const repoPath = './'
        fetchOneCommit(notExistingCommitSha, repoPath, false).subscribe({
            next: () => {
                done('should not return a value')
            },
            error: (error) => {
                expect(error instanceof Error).to.be.true;
                done();
            },
            complete: () => {
                done('should not complete')
            }
        });
    });

    it('should notify the first commit object of this repo', (done) => {
        const firstCommitOfThisRepo = '8767d5864e7d72df0f25915fe8e0652244eee5fa'
        const repoPath = './'
        fetchOneCommit(firstCommitOfThisRepo, repoPath, false).subscribe({
            next: (commitCompact) => {
                expect(commitCompact.sha).equal(firstCommitOfThisRepo);
                done();
            },
            error: (error) => {
                done(error);
            },
        });
    });
});