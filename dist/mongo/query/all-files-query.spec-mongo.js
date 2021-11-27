"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const load_commits_1 = require("../load/load-commits");
const load_files_1 = require("../load/load-files");
const all_files_query_1 = require("./all-files-query");
describe(`allFiles`, () => {
    it(`calculates the tot number of files and the tot churn from a files collection`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
        // then augment the files with their creation date
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.addAllFilesWithCreationDate)(connectionString, dbName, commitCollection)), 
        // then calculate the tot number of files and churn
        (0, rxjs_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, all_files_query_1.allFiles)(connectionString, dbName, filesCollection)), (0, rxjs_1.tap)(({ totNumFiles, totCloc, totLinesAdded, totLinesDeleted }) => {
            (0, chai_1.expect)(totNumFiles).equal(3);
            (0, chai_1.expect)(totCloc).equal(11);
            (0, chai_1.expect)(totLinesAdded).equal(23);
            (0, chai_1.expect)(totLinesDeleted).equal(5);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=all-files-query.spec-mongo.js.map