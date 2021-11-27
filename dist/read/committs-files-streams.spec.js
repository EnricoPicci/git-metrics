"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const committs_files_streams_1 = require("./committs-files-streams");
const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
describe(`commitsStream`, () => {
    it(`reads the commit and cloc info and generates a stream of commitDocs`, (done) => {
        (0, committs_files_streams_1.commitsWithClocInfoStream)(commitLogPath, clocLogPath)
            .pipe((0, rxjs_1.tap)({
            next: (commit) => {
                (0, chai_1.expect)(commit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allCommits) => {
                (0, chai_1.expect)(allCommits.length).equal(3);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`reads the commit and cloc info and generates a stream of commitDocs - considers only commits after a certain date`, (done) => {
        const after = new Date('2021-01-01');
        (0, committs_files_streams_1.commitsWithClocInfoStream)(commitLogPath, clocLogPath, after)
            .pipe((0, rxjs_1.tap)({
            next: (commit) => {
                (0, chai_1.expect)(commit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allCommits) => {
                (0, chai_1.expect)(allCommits.length).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`filesStream`, () => {
    it(`reads the commit and cloc info and generates a stream of FileDocs`, (done) => {
        (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath)
            .pipe((0, rxjs_1.tap)({
            next: (fileCommit) => {
                (0, chai_1.expect)(fileCommit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allFileCommits) => {
                (0, chai_1.expect)(allFileCommits.length).equal(7);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`fileChurnDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileDocs, where each FileDoc has its properties filled`, (done) => {
        const fileCommits = (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath);
        (0, committs_files_streams_1.fileChurnDictionary)(fileCommits)
            .pipe((0, rxjs_1.tap)({
            next: (fileCommitDictionary) => {
                (0, chai_1.expect)(fileCommitDictionary).not.undefined;
            },
        }), (0, rxjs_1.tap)({
            next: (fileCommitDictionary) => {
                (0, chai_1.expect)(fileCommitDictionary['good-by.java']).not.undefined;
                (0, chai_1.expect)(fileCommitDictionary['good-by.py']).not.undefined;
                (0, chai_1.expect)(fileCommitDictionary['hallo.java']).not.undefined;
                const halloJavaFileCommit = fileCommitDictionary['hallo.java'];
                (0, chai_1.expect)(halloJavaFileCommit.commits).equal(3);
                (0, chai_1.expect)(halloJavaFileCommit.linesAdded).equal(13);
                (0, chai_1.expect)(halloJavaFileCommit.linesDeleted).equal(3);
                (0, chai_1.expect)(halloJavaFileCommit.linesAddDel).equal(16);
                (0, chai_1.expect)(halloJavaFileCommit.created.getFullYear()).equal(2019);
                (0, chai_1.expect)(halloJavaFileCommit.created.getMonth()).equal(8);
                (0, chai_1.expect)(halloJavaFileCommit.created.getDate()).equal(22);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`fileChurn`, () => {
    it(`reads the commit and cloc info and generates a stream of FileChurn objects`, (done) => {
        const fileCommits = (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath);
        (0, committs_files_streams_1.fileChurn)(fileCommits)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (fileChurns) => {
                (0, chai_1.expect)(fileChurns).not.undefined;
                // the numebr of file churns notified is equal to the number of files in the commit log
                (0, chai_1.expect)(fileChurns.length).equal(3);
            },
        }), (0, rxjs_1.tap)({
            next: (fileChurns) => {
                const halloJavaFileCommits = fileChurns.filter((fc) => fc.path === 'hallo.java');
                (0, chai_1.expect)(halloJavaFileCommits.length).equal(1);
                const halloJavaFileCommit = halloJavaFileCommits[0];
                (0, chai_1.expect)(halloJavaFileCommit.commits).equal(3);
                (0, chai_1.expect)(halloJavaFileCommit.linesAdded).equal(13);
                (0, chai_1.expect)(halloJavaFileCommit.linesDeleted).equal(3);
                (0, chai_1.expect)(halloJavaFileCommit.linesAddDel).equal(16);
                (0, chai_1.expect)(halloJavaFileCommit.created.getFullYear()).equal(2019);
                (0, chai_1.expect)(halloJavaFileCommit.created.getMonth()).equal(8);
                (0, chai_1.expect)(halloJavaFileCommit.created.getDate()).equal(22);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`authorCommitsDictionary`, () => {
    it(`reads the commit info and generates a dictionary with the author as key and the number of commits as value`, (done) => {
        const _commitStream = (0, committs_files_streams_1.commitsStream)(commitLogPath);
        (0, committs_files_streams_1.authorCommitsDictionary)(_commitStream)
            .pipe((0, rxjs_1.tap)({
            next: (authorCommitDictionary) => {
                (0, chai_1.expect)(authorCommitDictionary).not.undefined;
                (0, chai_1.expect)(Object.keys(authorCommitDictionary).length).equal(3);
                (0, chai_1.expect)(authorCommitDictionary['Picci-1']).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-2']).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-3']).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`reads the commit info and generates a dictionary with the author as key and the number of commits as value
    considers only the commits after a certain date`, (done) => {
        const _commitStream = (0, committs_files_streams_1.commitsStream)(commitLogPath);
        const after = new Date('2021-01-01');
        (0, committs_files_streams_1.authorCommitsDictionary)(_commitStream, after)
            .pipe((0, rxjs_1.tap)({
            next: (authorCommitDictionary) => {
                (0, chai_1.expect)(authorCommitDictionary).not.undefined;
                (0, chai_1.expect)(Object.keys(authorCommitDictionary).length).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-3']).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`authorChurn`, () => {
    it(`reads the commit info and generates a stream of AuthorChurn objects`, (done) => {
        const commits = (0, committs_files_streams_1.commitsStream)(commitLogPath);
        const fileCommits = (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath);
        (0, committs_files_streams_1.authorChurn)(commits, fileCommits)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (authorChurns) => {
                (0, chai_1.expect)(authorChurns.length).equal(3);
                const oneAuthor = authorChurns.find((a) => a.authorName === 'Picci-1');
                (0, chai_1.expect)(oneAuthor.commits).equal(1);
                (0, chai_1.expect)(oneAuthor.linesAddDel).equal(17);
                (0, chai_1.expect)(oneAuthor.firstCommit.getFullYear()).equal(2019);
                (0, chai_1.expect)(oneAuthor.firstCommit.getMonth()).equal(8);
                (0, chai_1.expect)(oneAuthor.firstCommit.getDate()).equal(22);
                (0, chai_1.expect)(oneAuthor.firstCommit).equal(oneAuthor.lastCommit);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`reads the commit info and generates a stream of AuthorChurn objects
    considers only the commits after a certain date`, (done) => {
        const commits = (0, committs_files_streams_1.commitsStream)(commitLogPath);
        const fileCommits = (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath);
        const after = new Date('2021-01-01');
        (0, committs_files_streams_1.authorChurn)(commits, fileCommits, after)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (authorChurns) => {
                (0, chai_1.expect)(authorChurns.length).equal(1);
                const oneAuthor = authorChurns.find((a) => a.authorName === 'Picci-3');
                (0, chai_1.expect)(oneAuthor.commits).equal(1);
                (0, chai_1.expect)(oneAuthor.linesAddDel).equal(5);
                (0, chai_1.expect)(oneAuthor.firstCommit.getFullYear()).equal(2021);
                (0, chai_1.expect)(oneAuthor.firstCommit.getMonth()).equal(8);
                (0, chai_1.expect)(oneAuthor.firstCommit.getDate()).equal(22);
                (0, chai_1.expect)(oneAuthor.firstCommit).equal(oneAuthor.lastCommit);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`fileAuthorsDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileAuthors, where each FileAuthors has its properties filled`, (done) => {
        const fileCommits = (0, committs_files_streams_1.filesStream)(commitLogPath, clocLogPath);
        (0, committs_files_streams_1.fileAuthorsDictionary)(fileCommits)
            .pipe((0, rxjs_1.tap)({
            next: (fileAuthorsDictionary) => {
                (0, chai_1.expect)(fileAuthorsDictionary).not.undefined;
            },
        }), (0, rxjs_1.tap)({
            next: (fileAuthorsDictionary) => {
                (0, chai_1.expect)(fileAuthorsDictionary['good-by.java']).not.undefined;
                (0, chai_1.expect)(fileAuthorsDictionary['good-by.py']).not.undefined;
                (0, chai_1.expect)(fileAuthorsDictionary['hallo.java']).not.undefined;
                const halloJavaFileAuthors = fileAuthorsDictionary['hallo.java'];
                (0, chai_1.expect)(halloJavaFileAuthors.authors).equal(3);
                (0, chai_1.expect)(halloJavaFileAuthors.commits).equal(3);
                (0, chai_1.expect)(halloJavaFileAuthors.linesAdded).equal(13);
                (0, chai_1.expect)(halloJavaFileAuthors.linesDeleted).equal(3);
                (0, chai_1.expect)(halloJavaFileAuthors.linesAddDel).equal(16);
                (0, chai_1.expect)(halloJavaFileAuthors.created.getFullYear()).equal(2019);
                (0, chai_1.expect)(halloJavaFileAuthors.created.getMonth()).equal(8);
                (0, chai_1.expect)(halloJavaFileAuthors.created.getDate()).equal(22);
            },
        }))
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
        const fileCommits = (0, committs_files_streams_1.filesStream)(_commitLogPath, _clocLogPath);
        (0, committs_files_streams_1.fileAuthors)(fileCommits)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (fileAuthors) => {
                (0, chai_1.expect)(fileAuthors.length).equal(2);
            },
        }), (0, rxjs_1.tap)({
            next: (fileAuthors) => {
                (0, chai_1.expect)(fileAuthors.find((fa) => fa.path === 'touched-by-Authors-1-2.java')).not.undefined;
                (0, chai_1.expect)(fileAuthors.find((fa) => fa.path === 'touched-by-Author-1-only.java')).not.undefined;
                const f_1 = fileAuthors.find((fa) => fa.path === 'touched-by-Author-1-only.java');
                (0, chai_1.expect)(f_1.authors).equal(1);
                (0, chai_1.expect)(f_1.commits).equal(3);
                // the first file in the array is the one which has more authors
                (0, chai_1.expect)(fileAuthors[0].path).equal('touched-by-Authors-1-2.java');
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=committs-files-streams.spec.js.map