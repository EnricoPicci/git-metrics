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
const files_authors_query_1 = require("./files-authors-query");
describe(`fileAuthors`, () => {
    it(`calculates the total number authors for each file`, (done) => {
        const logName = 'git-repo-5-files-authors';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_authors_query_1.fileAuthors)(connectionString, dbName, filesCollection)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(2);
            const f1 = files.find((f) => f.path === 'file-1.txt');
            (0, chai_1.expect)(f1.authors).equal(2);
            (0, chai_1.expect)(f1.linesAdded).equal(10);
            (0, chai_1.expect)(f1.linesDeleted).equal(4);
            (0, chai_1.expect)(f1.linesAddDel).equal(14);
            (0, chai_1.expect)(f1.commits).equal(3);
            (0, chai_1.expect)(f1.created.getFullYear()).equal(2019);
            (0, chai_1.expect)(f1.created.getMonth() + 1).equal(7);
            (0, chai_1.expect)(f1.created.getDate()).equal(20);
            const f2 = files.find((f) => f.path === 'file-2.txt');
            (0, chai_1.expect)(f2.authors).equal(1);
            (0, chai_1.expect)(f2.linesAdded).equal(5);
            (0, chai_1.expect)(f2.linesDeleted).equal(2);
            (0, chai_1.expect)(f2.linesAddDel).equal(7);
            (0, chai_1.expect)(f2.commits).equal(2);
            (0, chai_1.expect)(f2.created.getFullYear()).equal(2019);
            (0, chai_1.expect)(f2.created.getMonth() + 1).equal(7);
            (0, chai_1.expect)(f2.created.getDate()).equal(20);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`calculates the total number of lines added and deleted for each file after a certain date`, (done) => {
        const logName = 'git-repo-5-files-churn';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const after = new Date('2021-08-19');
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_authors_query_1.fileAuthors)(connectionString, dbName, filesCollection, after)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(2);
            const f1 = files.find((f) => f.path === 'file-1.txt');
            (0, chai_1.expect)(f1.authors).equal(1);
            (0, chai_1.expect)(f1.linesAdded).equal(5);
            (0, chai_1.expect)(f1.linesDeleted).equal(3);
            (0, chai_1.expect)(f1.commits).equal(1);
            (0, chai_1.expect)(f1.created.getFullYear()).equal(2019);
            (0, chai_1.expect)(f1.created.getMonth() + 1).equal(7);
            (0, chai_1.expect)(f1.created.getDate()).equal(20);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`calculates the total number of lines added and deleted for each file from a real world repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_authors_query_1.fileAuthors)(connectionString, dbName, filesCollection)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(374);
            const f1 = files.find((f) => f.path === 'src/utils/APICredential.ts');
            (0, chai_1.expect)(f1.authors).equal(2);
            (0, chai_1.expect)(f1.linesAdded).equal(41);
            (0, chai_1.expect)(f1.linesDeleted).equal(41);
            (0, chai_1.expect)(f1.commits).equal(4);
            (0, chai_1.expect)(f1.created.getFullYear()).equal(2018);
            (0, chai_1.expect)(f1.created.getMonth() + 1).equal(2);
            (0, chai_1.expect)(f1.created.getDate()).equal(23);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=files-authors-query.spec.js.map