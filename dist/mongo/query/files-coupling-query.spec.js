"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const path_1 = __importDefault(require("path"));
const load_commits_1 = require("../load/load-commits");
const files_coupling_query_1 = require("./files-coupling-query");
describe(`filesCoupling`, () => {
    it(`calculates how many times a file is committed together with other each file`, (done) => {
        const logName = 'io-backend-not-so-small';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection }) => (0, files_coupling_query_1.filesCoupling)(connectionString, dbName, commitsCollection, new Date('2021-08-01'))), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files).not.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    // it(`calculates the total number of lines added and deleted for each file after a certain date`, (done) => {
    //     const logName = 'git-repo-5-files-churn';
    //     const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
    //     const connectionString = 'mongodb://localhost:27017';
    //     const params: [string, string, string] = [logFilePath, connectionString, logName]
    //     const after = new Date('2021-08-19');
    //     // first load the commits
    //     loadAllCommits(...params)
    //         .pipe(
    //             concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
    //                 addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
    //             ),
    //             concatMap(({ connectionString, dbName, filesCollection }) =>
    //                 fileAuthors(connectionString, dbName, filesCollection, after),
    //             ),
    //             toArray(),
    //             tap((files) => {
    //                 expect(files.length).equal(2);
    //                 const f1 = files.find((f) => f.path === 'file-1.txt');
    //                 expect(f1.authors).equal(1);
    //                 expect(f1.linesAdded).equal(5);
    //                 expect(f1.linesDeleted).equal(3);
    //                 expect(f1.commits).equal(1);
    //                 expect(f1.created.getFullYear()).equal(2019);
    //                 expect(f1.created.getMonth() + 1).equal(7);
    //                 expect(f1.created.getDate()).equal(20);
    //             }),
    //         )
    //         .subscribe({
    //             error: (err) => done(err),
    //             complete: () => done(),
    //         });
    // });
    // it(`calculates the total number of lines added and deleted for each file from a real world repo`, (done) => {
    //     const logName = 'io-backend';
    //     const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
    //     const connectionString = 'mongodb://localhost:27017';
    //     const params: [string, string, string] = [logFilePath, connectionString, logName]
    //     // first load the commits
    //     loadAllCommits(...params)
    //         .pipe(
    //             concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
    //                 addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
    //             ),
    //             concatMap(({ connectionString, dbName, filesCollection }) =>
    //                 fileAuthors(connectionString, dbName, filesCollection),
    //             ),
    //             toArray(),
    //             tap((files) => {
    //                 expect(files.length).equal(374);
    //                 const f1 = files.find((f) => f.path === 'src/utils/APICredential.ts');
    //                 expect(f1.authors).equal(2);
    //                 expect(f1.linesAdded).equal(41);
    //                 expect(f1.linesDeleted).equal(41);
    //                 expect(f1.commits).equal(4);
    //                 expect(f1.created.getFullYear()).equal(2018);
    //                 expect(f1.created.getMonth() + 1).equal(2);
    //                 expect(f1.created.getDate()).equal(23);
    //             }),
    //         )
    //         .subscribe({
    //             error: (err) => done(err),
    //             complete: () => done(),
    //         });
    // }).timeout(20000);
});
//# sourceMappingURL=files-coupling-query.spec.js.map