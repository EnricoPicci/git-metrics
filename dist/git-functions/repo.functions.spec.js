"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repo_functions_1 = require("./repo.functions");
describe('reposCompactInFolderObs', () => {
    it('should return notify a stream of values since the difference between the commits is performed on this repo', (done) => {
        const repoPath = './';
        (0, repo_functions_1.reposCompactInFolderObs)(repoPath, new Date(0), new Date(Date.now())).subscribe({
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
        (0, repo_functions_1.getRemoteOriginUrl)(repoPath).subscribe({
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
        (0, repo_functions_1.getRemoteOriginUrl)(repoPathThatDoesNotExist).subscribe({
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
//# sourceMappingURL=repo.functions.spec.js.map