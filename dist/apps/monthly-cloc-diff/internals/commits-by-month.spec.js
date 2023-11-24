"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const commits_by_month_1 = require("./commits-by-month");
// #copilot - these tests have been generated by copilot, not perfet but reasonably well structured
describe('commitsByMonth', () => {
    it('should group commits by month and year', () => {
        const commits = [
            { sha: '123', date: new Date('2021-01-01'), author: 'author1', subject: 'comment', repo: 'repo' },
            { sha: '456', date: new Date('2021-01-15'), author: 'author2', subject: 'comment', repo: 'repo' },
            { sha: '789', date: new Date('2021-02-01'), author: 'author1', subject: 'comment', repo: 'repo' },
            { sha: 'abc', date: new Date('2021-02-15'), author: 'author3', subject: 'comment', repo: 'repo' },
            { sha: 'def', date: new Date('2021-03-01'), author: 'author1', subject: 'comment', repo: 'repo' },
        ];
        const expected = {
            '2021-01': {
                commits: [
                    { sha: '123', date: new Date('2021-01-01'), author: 'author1', subject: 'comment', repo: 'repo' },
                    { sha: '456', date: new Date('2021-01-15'), author: 'author2', subject: 'comment', repo: 'repo' },
                ],
                authors: new Set(['author1', 'author2'])
            },
            '2021-02': {
                commits: [
                    { sha: '789', date: new Date('2021-02-01'), author: 'author1', subject: 'comment', repo: 'repo' },
                    { sha: 'abc', date: new Date('2021-02-15'), author: 'author3', subject: 'comment', repo: 'repo' },
                ],
                authors: new Set(['author1', 'author3'])
            },
            '2021-03': {
                commits: [
                    { sha: 'def', date: new Date('2021-03-01'), author: 'author1', subject: 'comment', repo: 'repo' },
                ],
                authors: new Set(['author1'])
            },
        };
        Object.entries(expected).forEach(([key, value]) => {
            (0, chai_1.expect)((0, commits_by_month_1.newCommitsByMonth)(commits)[key]).deep.equal(value);
        });
    });
    it('should return an empty object for an empty array', () => {
        const commits = [];
        const expected = {};
        (0, chai_1.expect)((0, commits_by_month_1.newCommitsByMonth)(commits)).deep.equal(expected);
    });
});
//# sourceMappingURL=commits-by-month.spec.js.map