import { toArray, tap, concatMap } from 'rxjs';
import { expect } from 'chai';
import { gitReadCommitEnrich, gitReadEnrich } from './git-read-enrich';

describe(`gitReadEnrich`, () => {
    it(`returns stream of GitCommitEnriched and a stream of FileGitCommitEnriched objects using this project as source repo since this
    project folder contains a .git repo`, (done) => {
        const repoFolderPath = './';
        const filter = ['*.ts'];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits.log';

        const [commits, fileCommits] = gitReadEnrich(repoFolderPath, filter, outDir, outFile);
        commits
            .pipe(
                toArray(),
                tap({
                    next: (commits) => {
                        expect(commits.length).gt(0);
                        const aCommit = commits[0];
                        expect(aCommit.committerDate).not.undefined;
                        expect(aCommit.authorName).not.undefined;
                        expect(aCommit.committerDate).not.undefined;
                        expect(aCommit.committerName).not.undefined;
                        expect(aCommit.files).not.undefined;
                        expect(Array.isArray(aCommit.files)).true;
                        expect(aCommit.hashShort).not.undefined;
                        expect(aCommit.parents).not.undefined;
                        expect(Array.isArray(aCommit.parents)).true;
                        //
                        const aSecondCommit = commits[1];
                        expect(Array.isArray(aSecondCommit.parents)).true;
                    },
                }),
                concatMap(() => fileCommits),
                toArray(),
                tap({
                    next: (fileCommits) => {
                        expect(fileCommits.length).gt(0);
                        const aFileCommit = fileCommits[0];
                        expect(aFileCommit.committerDate).not.undefined;
                        expect(aFileCommit.authorName).not.undefined;
                        expect(aFileCommit.committerDate).not.undefined;
                        expect(aFileCommit.committerName).not.undefined;
                        expect(aFileCommit.hashShort).not.undefined;
                        expect(aFileCommit.path).not.undefined;
                    },
                }),
            )
            .subscribe({
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`gitReadCommitEnrich`, () => {
    it(`returns stream of GitCommitEnriched objects in reverse order using this project as source repo since this
    project folder contains a .git repo`, (done) => {
        const repoFolderPath = './';
        const filter = ['*.ts'];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits.log';
        const reverse = true;

        const commits = gitReadCommitEnrich(repoFolderPath, filter, outDir, outFile, null, null, reverse);
        commits
            .pipe(
                toArray(),
                tap({
                    next: (commits) => {
                        expect(commits.length).gt(0);
                        const eldestCommit = commits[0];
                        const youngestCommit = commits[commits.length - 1];
                        expect(eldestCommit.committerDate <= youngestCommit.committerDate).true;
                    },
                }),
            )
            .subscribe({
                complete: () => done(),
            });
    }).timeout(20000);
});
