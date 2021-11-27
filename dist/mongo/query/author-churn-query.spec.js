"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const path_1 = __importDefault(require("path"));
const load_commits_1 = require("../load/load-commits");
const load_files_1 = require("../load/load-files");
const author_churn_query_1 = require("./author-churn-query");
describe(`authorChurn`, () => {
    it(`query commits and files collections to calculate the churn info for author`, (done) => {
        const logName = 'git-repo-5-author-churn';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection, commitsCollection }) => 
        // then query for the author churns
        (0, author_churn_query_1.authorChurn)(connectionString, dbName, filesCollection, commitsCollection)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((authors) => {
            (0, chai_1.expect)(authors.length).equal(2);
            const a1 = authors.find((a) => a.authorName === 'Picci-1');
            (0, chai_1.expect)(a1.linesAdded).equal(12);
            (0, chai_1.expect)(a1.linesDeleted).equal(5);
            (0, chai_1.expect)(a1.linesAddDel).equal(17);
            (0, chai_1.expect)(a1.commits).equal(2);
            (0, chai_1.expect)(a1.firstCommit.getFullYear()).equal(2019);
            (0, chai_1.expect)(a1.lastCommit.getFullYear()).equal(2021);
            const a2 = authors.find((a) => a.authorName === 'Picci-2');
            (0, chai_1.expect)(a2.linesAdded).equal(3);
            (0, chai_1.expect)(a2.linesDeleted).equal(1);
            (0, chai_1.expect)(a2.linesAddDel).equal(4);
            (0, chai_1.expect)(a2.commits).equal(1);
            (0, chai_1.expect)(a2.firstCommit.getFullYear()).equal(2020);
            (0, chai_1.expect)(a2.lastCommit.getFullYear()).equal(2020);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`query commits and files collections to calculate the churn info for author after a certain date`, (done) => {
        const logName = 'git-repo-5-author-churn';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const after = new Date('2020-08-19');
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection, commitsCollection }) => 
        // then query for the author churns
        (0, author_churn_query_1.authorChurn)(connectionString, dbName, filesCollection, commitsCollection, after)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((authors) => {
            (0, chai_1.expect)(authors.length).equal(2);
            const a1 = authors.find((a) => a.authorName === 'Picci-1');
            (0, chai_1.expect)(a1.linesAdded).equal(9);
            (0, chai_1.expect)(a1.linesDeleted).equal(5);
            (0, chai_1.expect)(a1.linesAddDel).equal(14);
            (0, chai_1.expect)(a1.commits).equal(1);
            (0, chai_1.expect)(a1.firstCommit.getFullYear()).equal(2021);
            (0, chai_1.expect)(a1.lastCommit.getFullYear()).equal(2021);
            const a2 = authors.find((a) => a.authorName === 'Picci-2');
            (0, chai_1.expect)(a2.linesAdded).equal(3);
            (0, chai_1.expect)(a2.linesDeleted).equal(1);
            (0, chai_1.expect)(a2.linesAddDel).equal(4);
            (0, chai_1.expect)(a2.commits).equal(1);
            (0, chai_1.expect)(a2.firstCommit.getFullYear()).equal(2020);
            (0, chai_1.expect)(a2.lastCommit.getFullYear()).equal(2020);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`calculate the churn info for author from a real world repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection, commitsCollection }) => 
        // then query for the author churns
        (0, author_churn_query_1.authorChurn)(connectionString, dbName, filesCollection, commitsCollection)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((authors) => {
            (0, chai_1.expect)(authors.length).equal(25);
            const a1 = authors.find((a) => a.authorName === 'Danilo Spinelli');
            (0, chai_1.expect)(a1).not.undefined;
            (0, chai_1.expect)(a1.linesAddDel).gt(0);
            (0, chai_1.expect)(a1.commits).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=author-churn-query.spec.js.map