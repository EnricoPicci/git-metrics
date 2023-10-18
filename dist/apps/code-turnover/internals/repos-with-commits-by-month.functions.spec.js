"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repos_with_commits_by_month_functions_1 = require("./repos-with-commits-by-month.functions");
const repos_with_commits_by_month_functions_2 = require("./repos-with-commits-by-month.functions");
// #copilot - good part of the boilerplate of these tests has been generated by copilot
describe('groupRepoCommitsByMonth', () => {
    it('should group commits by month and year for multiple repos', () => {
        const repos = [
            {
                path: 'user/repo1',
                commits: [],
                commitsByMonth: {
                    '2021-01': {
                        commits: [
                            { sha: '123', author: 'author1', date: new Date('2021-01-01'), subject: 'comment' },
                            { sha: '456', author: 'author2', date: new Date('2021-01-15'), subject: 'comment' },
                        ],
                        authors: new Set(['author1', 'author2']),
                    },
                    '2021-02': {
                        commits: [
                            { sha: '789', author: 'author3', date: new Date('2021-02-01'), subject: 'comment' },
                            { sha: 'abc', author: 'author1', date: new Date('2021-02-15'), subject: 'comment' },
                        ],
                        authors: new Set(['author1', 'author3']),
                    },
                },
            },
            {
                path: 'user/repo2',
                commits: [],
                commitsByMonth: {
                    '2021-01': {
                        commits: [
                            { sha: 'def', author: 'author5', date: new Date('2021-01-01'), subject: 'comment' },
                            { sha: 'ghi', author: 'author4', date: new Date('2021-01-15'), subject: 'comment' },
                        ],
                        authors: new Set(['author4', 'author5']),
                    },
                    '2021-02': {
                        commits: [
                            { sha: 'jkl', author: 'author4', date: new Date('2021-02-01'), subject: 'comment' },
                            { sha: 'mno', author: 'author6', date: new Date('2021-02-15'), subject: 'comment' },
                        ],
                        authors: new Set(['author4', 'author6']),
                    },
                },
            },
        ];
        const expected = {
            '2021-01': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '123', author: 'author1', date: new Date('2021-01-01'), subject: 'comment' },
                        { sha: '456', author: 'author2', date: new Date('2021-01-15'), subject: 'comment' },
                    ],
                    authors: ['author1', 'author2'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'def', author: 'author5', date: new Date('2021-01-01'), subject: 'comment' },
                        { sha: 'ghi', author: 'author4', date: new Date('2021-01-15'), subject: 'comment' },
                    ],
                    authors: ['author4', 'author5'],
                },
            ],
            '2021-02': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '789', author: 'author3', date: new Date('2021-02-01'), subject: 'comment' },
                        { sha: 'abc', author: 'author1', date: new Date('2021-02-15'), subject: 'comment' },
                    ],
                    authors: ['author1', 'author3'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'jkl', author: 'author4', date: new Date('2021-02-01'), subject: 'comment' },
                        { sha: 'mno', author: 'author6', date: new Date('2021-02-15'), subject: 'comment' },
                    ],
                    authors: ['author4', 'author6'],
                },
            ],
        };
        (0, chai_1.expect)((0, repos_with_commits_by_month_functions_1.newReposWithCommitsByMonth)(repos)).deep.equal(expected);
    });
    it('should throw an exception when there is an empty array', () => {
        const repos = [];
        (0, chai_1.expect)(() => (0, repos_with_commits_by_month_functions_1.newReposWithCommitsByMonth)(repos)).to.throw();
    });
});
// #copilot - good part of the boilerplate of these tests has been generated by copilot
describe('fillMissingMonths', () => {
    it('should fill in missing months between first and last months', () => {
        const reposByMonth = {
            '2021-01': [],
            '2021-03': [],
        };
        const expected = {
            '2021-01': [],
            '2021-02': [],
            '2021-03': [],
        };
        (0, repos_with_commits_by_month_functions_2.fillMissingMonths)(reposByMonth, '2021-01', '2021-03', []);
        (0, chai_1.expect)(reposByMonth).deep.equal(expected);
    });
    it('should not fill in months before first month or after last month', () => {
        const reposByMonth = {
            '2021-04': [],
            '2021-06': [],
        };
        const expected = {
            '2021-04': [],
            '2021-05': [],
            '2021-06': [],
        };
        (0, repos_with_commits_by_month_functions_2.fillMissingMonths)(reposByMonth, '2021-04', '2021-06', []);
        (0, chai_1.expect)(reposByMonth).deep.equal(expected);
    });
    it('should not modify object if all months are present', () => {
        const reposByMonth = {
            '2021-02': [],
            '2021-03': [],
            '2021-04': [],
        };
        const expected = {
            '2021-02': [],
            '2021-03': [],
            '2021-04': [],
        };
        (0, repos_with_commits_by_month_functions_2.fillMissingMonths)(reposByMonth, '2021-02', '2021-04', []);
        (0, chai_1.expect)(reposByMonth).deep.equal(expected);
    });
    it('should fill the missing months even when starting year and last year are different', () => {
        const reposByMonth = {
            '2021-11': [],
            '2022-02': [],
        };
        const expected = {
            '2021-11': [],
            '2021-12': [],
            '2022-01': [],
            '2022-02': [],
        };
        (0, repos_with_commits_by_month_functions_2.fillMissingMonths)(reposByMonth, '2021-11', '2022-02', []);
        (0, chai_1.expect)(reposByMonth).deep.equal(expected);
    });
});
// #copilot - all these tests has been generated by copilot
describe('repoCommitsByMonthRecords', () => {
    it('should return an array of records with repoPath and commits by month', () => {
        const reposByMonth = {
            '01-2021': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '123', author: 'author1', date: new Date('2021-01-01'), subject: 'comment' },
                        { sha: '456', author: 'author2', date: new Date('2021-01-15'), subject: 'comment' },
                    ],
                    authors: ['author1', 'author2'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'def', author: 'author5', date: new Date('2021-01-01'), subject: 'comment' },
                        { sha: 'ghi', author: 'author4', date: new Date('2021-01-15'), subject: 'comment' },
                    ],
                    authors: ['author4', 'author5'],
                },
            ],
            '02-2021': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '789', author: 'author3', date: new Date('2021-02-01'), subject: 'comment' },
                        { sha: 'abc', author: 'author1', date: new Date('2021-02-15'), subject: 'comment' },
                    ],
                    authors: ['author1', 'author3'],
                },
            ],
            '03-2021': [
                {
                    repoPath: 'user/repo1',
                    commits: [{ sha: 'xxx', author: 'author3', date: new Date('2021-03-01'), subject: 'comment' }],
                    authors: ['author1', 'author3'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'yyy', author: 'author4', date: new Date('2021-03-01'), subject: 'comment' },
                        { sha: 'zzz', author: 'author6', date: new Date('2021-03-15'), subject: 'comment' },
                    ],
                    authors: ['author4', 'author6'],
                },
            ],
        };
        const expected = [
            {
                repoPath: 'user/repo1',
                '01-2021': 2,
                '02-2021': 2,
                '03-2021': 1,
            },
            {
                repoPath: 'user/repo2',
                '01-2021': 2,
                '02-2021': 0,
                '03-2021': 2,
            },
        ];
        const records = (0, repos_with_commits_by_month_functions_1.repoCommitsByMonthRecords)(reposByMonth);
        (0, chai_1.expect)(records).deep.equal(expected);
    });
    it('should return empty array if input is empty', () => {
        const reposByMonth = {};
        const expected = [];
        const records = (0, repos_with_commits_by_month_functions_1.repoCommitsByMonthRecords)(reposByMonth);
        (0, chai_1.expect)(records).deep.equal(expected);
    });
});
//# sourceMappingURL=repos-with-commits-by-month.functions.spec.js.map