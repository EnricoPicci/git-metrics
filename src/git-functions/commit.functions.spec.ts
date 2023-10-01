import { expect } from 'chai';
import { readCommitFromLog$, readOneCommitFromLog$, writeCommitLog } from './commit.functions';
import { toArray } from 'rxjs';
import { ReadGitCommitParams } from './git-params';
import path from 'path';
import { readLinesObs } from 'observable-fs';

describe('readCommitFromLog$', () => {
    it('should throw an error if repoPath is not provided', () => {
        expect(() => readCommitFromLog$('')).to.throw()
    });

    it('should return a stream of commit objects from this repo', (done) => {
        readCommitFromLog$('./').pipe(
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

describe('readOneCommitFromLog$', () => {
    it('should throw an error if an not existing sha is provided', (done) => {
        const notExistingCommitSha = 'abc'
        const repoPath = './'
        readOneCommitFromLog$(notExistingCommitSha, repoPath, false).subscribe({
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
        readOneCommitFromLog$(firstCommitOfThisRepo, repoPath, false).subscribe({
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



describe(`writeCommitLog`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config: ReadGitCommitParams = {
            repoFolderPath: './',
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = writeCommitLog(config);
        expect(returnedOutFilePath).equal(expectedOutFilePath);

        const outFilePath = path.join(process.cwd(), outDir, outFile);

        readLinesObs(outFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                // one line for the commit and one line for each file
                // if we change and commit those files again this test will have to be adjusted
                // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                // we read from
                expect(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});