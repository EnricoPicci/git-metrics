import { expect } from 'chai';
import { tap, toArray } from 'rxjs';
import { fileAuthors, fileAuthorsDictionary } from './file-authors-aggregate';
import { filesStream } from '../git-enriched-streams/files';

const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;

describe(`fileAuthorsDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileAuthors, where each FileAuthors has its properties filled`, (done) => {
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        fileAuthorsDictionary(fileCommits)
            .pipe(
                tap({
                    next: (fileAuthorsDictionary) => {
                        expect(fileAuthorsDictionary).not.undefined;
                    },
                }),
                tap({
                    next: (fileAuthorsDictionary) => {
                        expect(fileAuthorsDictionary['good-by.java']).not.undefined;
                        expect(fileAuthorsDictionary['good-by.py']).not.undefined;
                        expect(fileAuthorsDictionary['hallo.java']).not.undefined;
                        const halloJavaFileAuthors = fileAuthorsDictionary['hallo.java'];
                        expect(halloJavaFileAuthors.authors).equal(3);
                        expect(halloJavaFileAuthors.commits).equal(3);
                        expect(halloJavaFileAuthors.linesAdded).equal(13);
                        expect(halloJavaFileAuthors.linesDeleted).equal(3);
                        expect(halloJavaFileAuthors.linesAddDel).equal(16);
                        expect(halloJavaFileAuthors.created.getFullYear()).equal(2019);
                        expect(halloJavaFileAuthors.created.getMonth()).equal(8);
                        expect(halloJavaFileAuthors.created.getDate()).equal(22);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`fileAuthors`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileAuthors. There is one author with many commits`, (done) => {
        const _commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-with-author-with-many-commits.gitlog`;
        const _clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-with-author-with-many-cloc.gitlog`;
        const fileCommits = filesStream(_commitLogPath, _clocLogPath);
        fileAuthors(fileCommits)
            .pipe(
                toArray(),
                tap({
                    next: (fileAuthors) => {
                        expect(fileAuthors.length).equal(2);
                    },
                }),
                tap({
                    next: (fileAuthors) => {
                        expect(fileAuthors.find((fa) => fa.path === 'touched-by-Authors-1-2.java')).not.undefined;
                        expect(fileAuthors.find((fa) => fa.path === 'touched-by-Author-1-only.java')).not.undefined;
                        const f_1 = fileAuthors.find((fa) => fa.path === 'touched-by-Author-1-only.java');
                        expect(f_1.authors).equal(1);
                        expect(f_1.commits).equal(3);
                        // the first file in the array is the one which has more authors
                        expect(fileAuthors[0].path).equal('touched-by-Authors-1-2.java');
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
