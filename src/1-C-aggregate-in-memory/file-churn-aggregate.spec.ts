import { expect } from 'chai';
import { tap, toArray } from 'rxjs';
import { fileChurn, fileChurnDictionary } from './file-churn-aggregate';
import { filesStream } from '../1-B-git-enriched-streams/files';

const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;

describe(`fileChurnDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileDocs, where each FileDoc has its properties filled`, (done) => {
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        fileChurnDictionary(fileCommits)
            .pipe(
                tap({
                    next: (fileCommitDictionary) => {
                        expect(fileCommitDictionary).not.undefined;
                    },
                }),
                tap({
                    next: (fileCommitDictionary) => {
                        expect(fileCommitDictionary['good-by.java']).not.undefined;
                        expect(fileCommitDictionary['good-by.py']).not.undefined;
                        expect(fileCommitDictionary['hallo.java']).not.undefined;
                        const halloJavaFileCommit = fileCommitDictionary['hallo.java'];
                        expect(halloJavaFileCommit.commits).equal(3);
                        expect(halloJavaFileCommit.linesAdded).equal(13);
                        expect(halloJavaFileCommit.linesDeleted).equal(3);
                        expect(halloJavaFileCommit.linesAddDel).equal(16);
                        expect(halloJavaFileCommit.created.getFullYear()).equal(2019);
                        expect(halloJavaFileCommit.created.getMonth()).equal(8);
                        expect(halloJavaFileCommit.created.getDate()).equal(22);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`fileChurn`, () => {
    it(`reads the commit and cloc info and generates a stream of FileChurn objects`, (done) => {
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        fileChurn(fileCommits)
            .pipe(
                toArray(),
                tap({
                    next: (fileChurns) => {
                        expect(fileChurns).not.undefined;
                        // the numebr of file churns notified is equal to the number of files in the commit log
                        expect(fileChurns.length).equal(3);
                    },
                }),
                tap({
                    next: (fileChurns) => {
                        const halloJavaFileCommits = fileChurns.filter((fc) => fc.path === 'hallo.java');
                        expect(halloJavaFileCommits.length).equal(1);
                        const halloJavaFileCommit = halloJavaFileCommits[0];
                        expect(halloJavaFileCommit.commits).equal(3);
                        expect(halloJavaFileCommit.linesAdded).equal(13);
                        expect(halloJavaFileCommit.linesDeleted).equal(3);
                        expect(halloJavaFileCommit.linesAddDel).equal(16);
                        expect(halloJavaFileCommit.created.getFullYear()).equal(2019);
                        expect(halloJavaFileCommit.created.getMonth()).equal(8);
                        expect(halloJavaFileCommit.created.getDate()).equal(22);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit and cloc info and generates a stream of FileChurn objects considering only the commits after a certain date`, (done) => {
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const after = new Date('2021-01-01');
        fileChurn(fileCommits, after)
            .pipe(
                toArray(),
                tap({
                    next: (fileChurns) => {
                        expect(fileChurns).not.undefined;
                        // the numebr of file churns notified is equal to the number of files in the commit log after the after date
                        expect(fileChurns.length).equal(1);
                    },
                }),
                tap({
                    next: (fileChurns) => {
                        const halloJavaFileCommits = fileChurns.filter((fc) => fc.path === 'hallo.java');
                        expect(halloJavaFileCommits.length).equal(1);
                        const halloJavaFileCommit = halloJavaFileCommits[0];
                        expect(halloJavaFileCommit.commits).equal(1);
                        expect(halloJavaFileCommit.linesAdded).equal(3);
                        expect(halloJavaFileCommit.linesDeleted).equal(2);
                        expect(halloJavaFileCommit.linesAddDel).equal(5);
                        expect(halloJavaFileCommit.created.getFullYear()).equal(2019);
                        expect(halloJavaFileCommit.created.getMonth()).equal(8);
                        expect(halloJavaFileCommit.created.getDate()).equal(22);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
