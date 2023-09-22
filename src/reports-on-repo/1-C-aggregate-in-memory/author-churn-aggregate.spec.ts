import { expect } from 'chai';
import { tap } from 'rxjs';
import { commitsStream } from '../1-B-git-enriched-streams/commits';
import { authorChurn, authorChurnDictionary } from './author-churn-aggregate';

const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;

describe(`authorChurnDictionary`, () => {
    it(`reads the commit info and generates a dictionary with the author as key and an AuthurChurn object as value`, (done) => {
        const _commitStream = commitsStream(commitLogPath);
        authorChurnDictionary(_commitStream)
            .pipe(
                tap({
                    next: (authorCommitDictionary) => {
                        expect(authorCommitDictionary).not.undefined;
                        expect(Object.keys(authorCommitDictionary).length).equal(3);
                        expect(authorCommitDictionary['Picci-1'].commits).equal(1);
                        expect(authorCommitDictionary['Picci-2'].commits).equal(1);
                        expect(authorCommitDictionary['Picci-3'].commits).equal(1);
                        //
                        const oneAuthor = authorCommitDictionary['Picci-1'];
                        expect(oneAuthor.firstCommit.getFullYear()).equal(2019);
                        expect(oneAuthor.firstCommit.getMonth()).equal(8);
                        expect(oneAuthor.firstCommit.getDate()).equal(22);
                        expect(oneAuthor.lastCommit.getFullYear()).equal(2019);
                        expect(oneAuthor.lastCommit.getMonth()).equal(8);
                        expect(oneAuthor.lastCommit.getDate()).equal(22);
                        expect(oneAuthor.linesAdded).equal(17);
                        expect(oneAuthor.linesDeleted).equal(0);
                        expect(oneAuthor.linesAddDel).equal(17);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit info and generates a dictionary with the author as key and the number of commits as value
    considers only the commits after a certain date`, (done) => {
        const _commitStream = commitsStream(commitLogPath);
        const after = new Date('2021-01-01');
        authorChurnDictionary(_commitStream, after)
            .pipe(
                tap({
                    next: (authorCommitDictionary) => {
                        expect(authorCommitDictionary).not.undefined;
                        expect(Object.keys(authorCommitDictionary).length).equal(1);
                        expect(authorCommitDictionary['Picci-3'].commits).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`authorChurnDictionary - special cases`, () => {
    it(`there is one commit without files for an author who does not have other commits - in this case this author does not apprea in the dictionary`, (done) => {
        const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-with-author-with-no-commits.gitlog`;
        const _commitStream = commitsStream(commitLogPath);
        authorChurnDictionary(_commitStream)
            .pipe(
                tap({
                    next: (authorCommitDictionary) => {
                        expect(authorCommitDictionary).not.undefined;
                        expect(Object.keys(authorCommitDictionary).length).equal(3);
                        expect(authorCommitDictionary['Picci-1'].commits).equal(1);
                        expect(authorCommitDictionary['Picci-2'].commits).equal(1);
                        expect(authorCommitDictionary['Picci-3'].commits).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`authorChurn`, () => {
    it(`reads the commit info and generates a stream of AuthorChurn objects`, (done) => {
        const commits = commitsStream(commitLogPath);
        authorChurn(commits)
            .pipe(
                tap({
                    next: (authorChurns) => {
                        expect(authorChurns.length).equal(3);
                        const oneAuthor = authorChurns.find((a) => a.authorName === 'Picci-1')!;
                        expect(oneAuthor.commits).equal(1);
                        expect(oneAuthor.linesAddDel).equal(17);
                        expect(oneAuthor.firstCommit.getFullYear()).equal(2019);
                        expect(oneAuthor.firstCommit.getMonth()).equal(8);
                        expect(oneAuthor.firstCommit.getDate()).equal(22);
                        expect(oneAuthor.firstCommit).equal(oneAuthor.lastCommit);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit info and generates a stream of AuthorChurn objects
    considers only the commits after a certain date`, (done) => {
        const commits = commitsStream(commitLogPath);
        const after = new Date('2021-01-01');
        authorChurn(commits, after)
            .pipe(
                tap({
                    next: (authorChurns) => {
                        expect(authorChurns.length).equal(1);
                        const oneAuthor = authorChurns.find((a) => a.authorName === 'Picci-3')!;
                        expect(oneAuthor.commits).equal(1);
                        expect(oneAuthor.linesAddDel).equal(5);
                        expect(oneAuthor.firstCommit.getFullYear()).equal(2021);
                        expect(oneAuthor.firstCommit.getMonth()).equal(8);
                        expect(oneAuthor.firstCommit.getDate()).equal(22);
                        expect(oneAuthor.firstCommit).equal(oneAuthor.lastCommit);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
