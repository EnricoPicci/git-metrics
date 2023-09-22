"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const file_authors_aggregate_1 = require("./file-authors-aggregate");
const files_1 = require("../reports-on-repos/1-B-git-enriched-streams/files");
const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
describe(`fileAuthorsDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileAuthors, where each FileAuthors has its properties filled`, (done) => {
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        (0, file_authors_aggregate_1.fileAuthorsDictionary)(fileCommits)
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
        const fileCommits = (0, files_1.filesStream)(_commitLogPath, _clocLogPath);
        (0, file_authors_aggregate_1.fileAuthors)(fileCommits)
            .pipe((0, rxjs_1.tap)({
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
//# sourceMappingURL=file-authors-aggregate.spec.js.map