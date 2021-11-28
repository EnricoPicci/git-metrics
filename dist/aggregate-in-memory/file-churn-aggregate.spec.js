"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const file_churn_aggregate_1 = require("./file-churn-aggregate");
const files_1 = require("../git-read-enrich/files");
const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
describe(`fileChurnDictionary`, () => {
    it(`reads the commit and cloc info and generates a dictionary of FileDocs, where each FileDoc has its properties filled`, (done) => {
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        (0, file_churn_aggregate_1.fileChurnDictionary)(fileCommits)
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
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        (0, file_churn_aggregate_1.fileChurn)(fileCommits)
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
    it(`reads the commit and cloc info and generates a stream of FileChurn objects considering only the commits after a certain date`, (done) => {
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const after = new Date('2021-01-01');
        (0, file_churn_aggregate_1.fileChurn)(fileCommits, after)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (fileChurns) => {
                (0, chai_1.expect)(fileChurns).not.undefined;
                // the numebr of file churns notified is equal to the number of files in the commit log after the after date
                (0, chai_1.expect)(fileChurns.length).equal(1);
            },
        }), (0, rxjs_1.tap)({
            next: (fileChurns) => {
                const halloJavaFileCommits = fileChurns.filter((fc) => fc.path === 'hallo.java');
                (0, chai_1.expect)(halloJavaFileCommits.length).equal(1);
                const halloJavaFileCommit = halloJavaFileCommits[0];
                (0, chai_1.expect)(halloJavaFileCommit.commits).equal(1);
                (0, chai_1.expect)(halloJavaFileCommit.linesAdded).equal(3);
                (0, chai_1.expect)(halloJavaFileCommit.linesDeleted).equal(2);
                (0, chai_1.expect)(halloJavaFileCommit.linesAddDel).equal(5);
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
//# sourceMappingURL=file-churn-aggregate.spec.js.map