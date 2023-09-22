"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repo_functions_1 = require("./repo.functions");
const repo_functions_2 = require("./repo.functions");
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
                            { sha: '123', author: 'author1', date: new Date('2021-01-01') },
                            { sha: '456', author: 'author2', date: new Date('2021-01-15') },
                        ],
                        authors: new Set(['author1', 'author2']),
                    },
                    '2021-02': {
                        commits: [
                            { sha: '789', author: 'author3', date: new Date('2021-02-01') },
                            { sha: 'abc', author: 'author1', date: new Date('2021-02-15') },
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
                            { sha: 'def', author: 'author5', date: new Date('2021-01-01') },
                            { sha: 'ghi', author: 'author4', date: new Date('2021-01-15') },
                        ],
                        authors: new Set(['author4', 'author5']),
                    },
                    '2021-02': {
                        commits: [
                            { sha: 'jkl', author: 'author4', date: new Date('2021-02-01') },
                            { sha: 'mno', author: 'author6', date: new Date('2021-02-15') },
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
                        { sha: '123', author: 'author1', date: new Date('2021-01-01') },
                        { sha: '456', author: 'author2', date: new Date('2021-01-15') },
                    ],
                    authors: ['author1', 'author2'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'def', author: 'author5', date: new Date('2021-01-01') },
                        { sha: 'ghi', author: 'author4', date: new Date('2021-01-15') },
                    ],
                    authors: ['author4', 'author5'],
                },
            ],
            '2021-02': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '789', author: 'author3', date: new Date('2021-02-01') },
                        { sha: 'abc', author: 'author1', date: new Date('2021-02-15') },
                    ],
                    authors: ['author1', 'author3'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'jkl', author: 'author4', date: new Date('2021-02-01') },
                        { sha: 'mno', author: 'author6', date: new Date('2021-02-15') },
                    ],
                    authors: ['author4', 'author6'],
                },
            ],
        };
        (0, chai_1.expect)((0, repo_functions_1.newReposWithCommitsByMonth)(repos)).deep.equal(expected);
    });
    it('should throw an exception when there is an empty array', () => {
        const repos = [];
        (0, chai_1.expect)(() => (0, repo_functions_1.newReposWithCommitsByMonth)(repos)).to.throw();
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
        (0, repo_functions_2.fillMissingMonths)(reposByMonth, '2021-01', '2021-03', []);
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
        (0, repo_functions_2.fillMissingMonths)(reposByMonth, '2021-04', '2021-06', []);
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
        (0, repo_functions_2.fillMissingMonths)(reposByMonth, '2021-02', '2021-04', []);
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
        (0, repo_functions_2.fillMissingMonths)(reposByMonth, '2021-11', '2022-02', []);
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
                        { sha: '123', author: 'author1', date: new Date('2021-01-01') },
                        { sha: '456', author: 'author2', date: new Date('2021-01-15') },
                    ],
                    authors: ['author1', 'author2'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'def', author: 'author5', date: new Date('2021-01-01') },
                        { sha: 'ghi', author: 'author4', date: new Date('2021-01-15') },
                    ],
                    authors: ['author4', 'author5'],
                },
            ],
            '02-2021': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: '789', author: 'author3', date: new Date('2021-02-01') },
                        { sha: 'abc', author: 'author1', date: new Date('2021-02-15') },
                    ],
                    authors: ['author1', 'author3'],
                },
            ],
            '03-2021': [
                {
                    repoPath: 'user/repo1',
                    commits: [
                        { sha: 'xxx', author: 'author3', date: new Date('2021-03-01') },
                    ],
                    authors: ['author1', 'author3'],
                },
                {
                    repoPath: 'user/repo2',
                    commits: [
                        { sha: 'yyy', author: 'author4', date: new Date('2021-03-01') },
                        { sha: 'zzz', author: 'author6', date: new Date('2021-03-15') },
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
        const records = (0, repo_functions_1.repoCommitsByMonthRecords)(reposByMonth);
        (0, chai_1.expect)(records).deep.equal(expected);
    });
    it('should return empty array if input is empty', () => {
        const reposByMonth = {};
        const expected = [];
        const records = (0, repo_functions_1.repoCommitsByMonthRecords)(reposByMonth);
        (0, chai_1.expect)(records).deep.equal(expected);
    });
});
describe('isToBeExcluded', () => {
    describe('isToBeExcluded', () => {
        it('should return true if the repo name is in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo';
            const excludeRepoPaths = ['my-repo', 'other-repo'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return true if the repo name matches a wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo-123';
            const excludeRepoPaths = ['my-repo-*', 'other-repo'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return true if the repo name matches a wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'one-repo-123';
            const excludeRepoPaths = ['my-repo-*', 'other-repo'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the repo name is not in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo';
            const excludeRepoPaths = ['other-repo'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the repo name does not match any wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo-123';
            const excludeRepoPaths = ['other-repo-*'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the excludeRepoPaths array is empty', () => {
            const repoPath = 'my-repo';
            const excludeRepoPaths = [];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return true if the repoPath is a real path and the excludeRepoPaths array contains a part of it', () => {
            const repoPath = '../../temp/iiab/SharedACN';
            const excludeRepoPaths = ['*dbm', 'dbobjects*', '*passptfdanni', '*sharedacn'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return false if the repoPath is a real path and the excludeRepoPaths array does not contain a part of it', () => {
            const repoPath = '../../temp/iiab/SharedACN';
            const excludeRepoPaths = ['*dbm', '*dbobjects*', '*passptfdanni'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return true if the repoPath is a real path and the excludeRepoPaths array contains a part of it', () => {
            const repoPath = '../../temp/vita/dbobjects-passvita';
            const excludeRepoPaths = ['*dbm', '*dbobjects*', '*passptfdanni'];
            const result = (0, repo_functions_1.isToBeExcluded)(repoPath, excludeRepoPaths);
            (0, chai_1.expect)(result).to.be.true;
        });
    });
});
describe('gitHttpsUrlFromGitSshUrl', () => {
    it('should convert a git ssh url to a git https url', () => {
        const gitSshUrl = 'git@git.ad.rgigroup.com:vita/dbobjects-passvita.git';
        const expectedGitHttpsUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git';
        const actualGitHttpsUrl = (0, repo_functions_1.gitHttpsUrlFromGitUrl)(gitSshUrl);
        (0, chai_1.expect)(actualGitHttpsUrl).equal(expectedGitHttpsUrl);
    });
    it('should return the same url if it starts with https://', () => {
        const gitUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git';
        const result = (0, repo_functions_1.gitHttpsUrlFromGitUrl)(gitUrl);
        (0, chai_1.expect)(result).to.equal(gitUrl);
    });
    it('should throw an error if the url does not start with git@', () => {
        const gitUrl = 'invalid-url';
        (0, chai_1.expect)(() => (0, repo_functions_1.gitHttpsUrlFromGitUrl)(gitUrl)).to.throw('gitUrl must start with "git@"');
    });
});
describe('getRemoteOriginUrl', () => {
    it('should return the remote origin url of a repo', (done) => {
        const repoPath = './';
        (0, repo_functions_1.getRemoteOriginUrl)(repoPath, false).subscribe({
            next: (remoteOriginUrl) => {
                (0, chai_1.expect)(typeof remoteOriginUrl).to.equal('string');
                (0, chai_1.expect)(remoteOriginUrl.startsWith('https://')).to.be.true;
                done();
            },
            error: (error) => {
                done(error);
            },
        });
    });
    it('should throw an error if the command fails', (done) => {
        const repoPathThatDoesNotExist = 'does-not-exist';
        (0, repo_functions_1.getRemoteOriginUrl)(repoPathThatDoesNotExist, false).subscribe({
            next: (remoteOriginUrl) => {
                done(`should not return a value - unfortunately it returns: ${remoteOriginUrl}`);
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
    // it('should throw an error if the command fails', async () => {
    //     const repoPath = '/path/to/repo'
    //     const expectedError = 'Error in getRemoteOriginUrl for repo "/path/to/repo"\nError: Command failed'
    //     // mock the executeCommandObs function to throw an error
    //     const executeCommandObs = () => throwError(new Error('Command failed'))
    //     try {
    //         await getRemoteOriginUrl(repoPath, false, executeCommandObs).toPromise()
    //         // if the function doesn't throw an error, the test fails
    //         expect.fail('Expected function to throw an error')
    //     } catch (error) {
    //         expect(error.message).to.equal(expectedError)
    //     }
    // })
});
//# sourceMappingURL=repo.functions.spec.js.map