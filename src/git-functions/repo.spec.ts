import { expect } from 'chai'
import { checkoutRepoAtBranch$, getRemoteOriginUrl$, gitHttpsUrlFromGitUrl, reposCompactInFolder$ } from './repo'
import { currentBranchName$ } from './branches';
import { concatMap } from 'rxjs';

describe('reposCompactInFolderObs', () => {
    it('should return notify a stream of values since the difference between the commits is performed on this repo', (done) => {
        const repoPath = './';

        reposCompactInFolder$(repoPath, new Date(0), new Date(Date.now())).subscribe({
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
        getRemoteOriginUrl$(repoPath).subscribe({
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
        getRemoteOriginUrl$(repoPathThatDoesNotExist).subscribe({
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

describe('checkoutRepoAtBranch$', () => {
    it('should checkout the current branch - the test tests simply that the function does not error', (done) => {
        const repoPath = './';

        let currentBranchName: string;

        currentBranchName$(repoPath).pipe(
            concatMap((branchName) => {
                currentBranchName = branchName;
                return checkoutRepoAtBranch$(repoPath, branchName);
            }),
            concatMap(() => {
                return currentBranchName$(repoPath);
            })
        ).subscribe({
            next: (branchName) => {
                // test simply that the branch name is the same as the current branch name calculated before
                // test that the function does not throw an error
                expect(branchName).equal(currentBranchName);
                done();
            },
            error: (err) => {
                done(err);
            },
        })
    });
});