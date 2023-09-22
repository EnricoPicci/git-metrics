import { expect } from 'chai'
import { getRemoteOriginUrl, gitHttpsUrlFromGitUrl, isToBeExcluded, reposCompactInFolderObs } from './repo.functions'

describe('reposCompactInFolderObs', () => {
    it('should return notify a stream of values since the difference between the commits is performed on this repo', (done) => {
        const repoPath = './';

        reposCompactInFolderObs(repoPath, new Date(0), new Date(Date.now())).subscribe({
            next: (repoCompact) => {
                expect(repoCompact.path).equal(repoPath);
                expect(repoCompact.commits.length).gt(0);
                done();
            },
            error: (err) => {
                done(err);
            },
        })
    });
});

describe('isToBeExcluded', () => {
    describe('isToBeExcluded', () => {
        it('should return true if the repo name is in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo'
            const excludeRepoPaths = ['my-repo', 'other-repo']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.true
        })

        it('should return true if the repo name matches a wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo-123'
            const excludeRepoPaths = ['my-repo-*', 'other-repo']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.true
        })

        it('should return true if the repo name matches a wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'one-repo-123'
            const excludeRepoPaths = ['my-repo-*', 'other-repo']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.false
        })

        it('should return false if the repo name is not in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo'
            const excludeRepoPaths = ['other-repo']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.false
        })

        it('should return false if the repo name does not match any wildcard pattern in the excludeRepoPaths array', () => {
            const repoPath = 'my-repo-123'
            const excludeRepoPaths = ['other-repo-*']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.false
        })

        it('should return false if the excludeRepoPaths array is empty', () => {
            const repoPath = 'my-repo'
            const excludeRepoPaths: string[] = []
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.false
        })

        it('should return true if the repoPath is a real path and the excludeRepoPaths array contains a part of it', () => {
            const repoPath = '../../temp/iiab/SharedACN'
            const excludeRepoPaths = ['*dbm', 'dbobjects*', '*passptfdanni', '*sharedacn']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.true
        })

        it('should return false if the repoPath is a real path and the excludeRepoPaths array does not contain a part of it', () => {
            const repoPath = '../../temp/iiab/SharedACN'
            const excludeRepoPaths = ['*dbm', '*dbobjects*', '*passptfdanni']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.false
        })

        it('should return true if the repoPath is a real path and the excludeRepoPaths array contains a part of it', () => {
            const repoPath = '../../temp/vita/dbobjects-passvita'
            const excludeRepoPaths = ['*dbm', '*dbobjects*', '*passptfdanni']
            const result = isToBeExcluded(repoPath, excludeRepoPaths)
            expect(result).to.be.true
        })

    })
})

describe('gitHttpsUrlFromGitSshUrl', () => {
    it('should convert a git ssh url to a git https url', () => {
        const gitSshUrl = 'git@git.ad.rgigroup.com:vita/dbobjects-passvita.git';
        const expectedGitHttpsUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git';
        const actualGitHttpsUrl = gitHttpsUrlFromGitUrl(gitSshUrl);
        expect(actualGitHttpsUrl).equal(expectedGitHttpsUrl);
    });

    it('should return the same url if it starts with https://', () => {
        const gitUrl = 'https://git.ad.rgigroup.com/vita/dbobjects-passvita.git'
        const result = gitHttpsUrlFromGitUrl(gitUrl)
        expect(result).to.equal(gitUrl)
    })

    it('should throw an error if the url does not start with git@', () => {
        const gitUrl = 'invalid-url'
        expect(() => gitHttpsUrlFromGitUrl(gitUrl)).to.throw('gitUrl must start with "git@"')
    })
});

describe('getRemoteOriginUrl', () => {
    it('should return the remote origin url of a repo', (done) => {
        const repoPath = './'
        getRemoteOriginUrl(repoPath).subscribe({
            next: (remoteOriginUrl) => {
                expect(typeof remoteOriginUrl).to.equal('string')
                expect(remoteOriginUrl.startsWith('https://')).to.be.true
                done()
            },
            error: (error) => {
                done(error)
            },
        })
    })


    it('should throw an error if the command fails', (done) => {
        const repoPathThatDoesNotExist = 'does-not-exist'
        getRemoteOriginUrl(repoPathThatDoesNotExist).subscribe({
            next: (remoteOriginUrl) => {
                done(`should not return a value - unfortunately it returns: ${remoteOriginUrl}`)
            },
            error: (error) => {
                expect(error instanceof Error).to.be.true
                done()
            },
            complete: () => {
                done('should not complete')
            }
        })
    })

})