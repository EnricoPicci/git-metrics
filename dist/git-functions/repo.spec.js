"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repo_1 = require("./repo");
const branches_1 = require("./branches");
const rxjs_1 = require("rxjs");
describe('reposCompactInFolderObs', () => {
    it('should return notify a stream of values since the difference between the commits is performed on this repo', (done) => {
        const repoPath = './';
        (0, repo_1.reposCompactInFolder$)(repoPath, new Date(0), new Date(Date.now())).subscribe({
            next: (repoCompact) => {
                (0, chai_1.expect)(repoCompact.path).equal(repoPath);
                (0, chai_1.expect)(repoCompact.commits.length).gt(0);
                done();
            },
            error: (err) => {
                done(err);
            },
        });
    });
});
describe('gitHttpsUrlFromGitSshUrl', () => {
    it('should convert a git ssh url to a git https url', () => {
        const gitSshUrl = 'git@git.ad.rgigroup.com:vita/dbobjects-passvita.git';
        const expectedGitHttpsUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git';
        const actualGitHttpsUrl = (0, repo_1.gitHttpsUrlFromGitUrl)(gitSshUrl);
        (0, chai_1.expect)(actualGitHttpsUrl).equal(expectedGitHttpsUrl);
    });
    it('should return the same url if it starts with https://', () => {
        const gitUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git';
        const result = (0, repo_1.gitHttpsUrlFromGitUrl)(gitUrl);
        (0, chai_1.expect)(result).to.equal(gitUrl);
    });
    it('should throw an error if the url does not start with git@', () => {
        const gitUrl = 'invalid-url';
        (0, chai_1.expect)(() => (0, repo_1.gitHttpsUrlFromGitUrl)(gitUrl)).to.throw('gitUrl must start with "git@"');
    });
});
describe('getRemoteOriginUrl', () => {
    it('should return the remote origin url of a repo', (done) => {
        const repoPath = './';
        (0, repo_1.getRemoteOriginUrl$)(repoPath).subscribe({
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
        (0, repo_1.getRemoteOriginUrl$)(repoPathThatDoesNotExist).subscribe({
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
});
describe('checkoutRepoAtBranch$', () => {
    it('should checkout the current branch - the test tests simply that the function does not error', (done) => {
        const repoPath = './';
        let currentBranchName;
        (0, branches_1.currentBranchName$)(repoPath).pipe((0, rxjs_1.concatMap)((branchName) => {
            currentBranchName = branchName;
            return (0, repo_1.checkoutRepoAtBranch$)(repoPath, branchName);
        }), (0, rxjs_1.concatMap)(() => {
            return (0, branches_1.currentBranchName$)(repoPath);
        })).subscribe({
            next: (branchName) => {
                // test simply that the branch name is the same as the current branch name calculated before
                // test that the function does not throw an error
                (0, chai_1.expect)(branchName).equal(currentBranchName);
                done();
            },
            error: (err) => {
                done(err);
            },
        });
    });
});
//# sourceMappingURL=repo.spec.js.map