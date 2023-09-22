"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const path_1 = __importDefault(require("path"));
const load_commits_files_1 = require("../load/load-commits-files");
const files_query_1 = require("./files-query");
describe(`files`, () => {
    it(`read the files`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits and the files
        (0, load_commits_files_1.loadAllCommitsFiles)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_query_1.files)(connectionString, dbName, filesCollection)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files).not.undefined;
            (0, chai_1.expect)(files.length).equal(7);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read the files after a certain date`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const after = new Date('2021-08-01');
        // first load the commits and the files
        (0, load_commits_files_1.loadAllCommitsFiles)(...params)
            .pipe((0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_query_1.files)(connectionString, dbName, filesCollection, after)), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)((files) => {
            (0, chai_1.expect)(files).not.undefined;
            (0, chai_1.expect)(files.length).equal(1);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=files-query.spec-mongo.js.map