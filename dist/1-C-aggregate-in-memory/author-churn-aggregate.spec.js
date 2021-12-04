"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const author_churn_aggregate_1 = require("./author-churn-aggregate");
const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
describe(`authorChurnDictionary`, () => {
    it(`reads the commit info and generates a dictionary with the author as key and an AuthurChurn object as value`, (done) => {
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        (0, author_churn_aggregate_1.authorChurnDictionary)(_commitStream)
            .pipe((0, rxjs_1.tap)({
            next: (authorCommitDictionary) => {
                (0, chai_1.expect)(authorCommitDictionary).not.undefined;
                (0, chai_1.expect)(Object.keys(authorCommitDictionary).length).equal(3);
                (0, chai_1.expect)(authorCommitDictionary['Picci-1'].commits).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-2'].commits).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-3'].commits).equal(1);
                //
                const oneAuthor = authorCommitDictionary['Picci-1'];
                (0, chai_1.expect)(oneAuthor.firstCommit.getFullYear()).equal(2019);
                (0, chai_1.expect)(oneAuthor.firstCommit.getMonth()).equal(8);
                (0, chai_1.expect)(oneAuthor.firstCommit.getDate()).equal(22);
                (0, chai_1.expect)(oneAuthor.lastCommit.getFullYear()).equal(2019);
                (0, chai_1.expect)(oneAuthor.lastCommit.getMonth()).equal(8);
                (0, chai_1.expect)(oneAuthor.lastCommit.getDate()).equal(22);
                (0, chai_1.expect)(oneAuthor.linesAdded).equal(17);
                (0, chai_1.expect)(oneAuthor.linesDeleted).equal(0);
                (0, chai_1.expect)(oneAuthor.linesAddDel).equal(17);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`reads the commit info and generates a dictionary with the author as key and the number of commits as value
    considers only the commits after a certain date`, (done) => {
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const after = new Date('2021-01-01');
        (0, author_churn_aggregate_1.authorChurnDictionary)(_commitStream, after)
            .pipe((0, rxjs_1.tap)({
            next: (authorCommitDictionary) => {
                (0, chai_1.expect)(authorCommitDictionary).not.undefined;
                (0, chai_1.expect)(Object.keys(authorCommitDictionary).length).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-3'].commits).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`authorChurnDictionary - special cases`, () => {
    it(`there is one commit without files for an author who does not have other commits - in this case this author does not apprea in the dictionary`, (done) => {
        const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-with-author-with-no-commits.gitlog`;
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        (0, author_churn_aggregate_1.authorChurnDictionary)(_commitStream)
            .pipe((0, rxjs_1.tap)({
            next: (authorCommitDictionary) => {
                (0, chai_1.expect)(authorCommitDictionary).not.undefined;
                (0, chai_1.expect)(Object.keys(authorCommitDictionary).length).equal(3);
                (0, chai_1.expect)(authorCommitDictionary['Picci-1'].commits).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-2'].commits).equal(1);
                (0, chai_1.expect)(authorCommitDictionary['Picci-3'].commits).equal(1);
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
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        (0, author_churn_aggregate_1.authorChurn)(commits)
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
        const commits = (0, commits_1.commitsStream)(commitLogPath);
        const after = new Date('2021-01-01');
        (0, author_churn_aggregate_1.authorChurn)(commits, after)
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
//# sourceMappingURL=author-churn-aggregate.spec.js.map