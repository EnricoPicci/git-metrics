"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
// import path from 'path';
const rxjs_1 = require("rxjs");
const load_commits_1 = require("../load/load-commits");
const all_commits_query_1 = require("./all-commits-query");
describe(`allCommits`, () => {
    it(`calculates the tot number of commits, the first and the last commit`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        // first load the commits
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
        // then calculate the tot number of commits, the first and the last
        (0, rxjs_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, all_commits_query_1.commitsInfo)(connectionString, dbName, commitCollection)), (0, rxjs_1.tap)(({ count, first, last }) => {
            (0, chai_1.expect)(count).equal(3);
            (0, chai_1.expect)(first.committerDate.getFullYear()).equal(2019);
            (0, chai_1.expect)(last.committerDate.getFullYear()).equal(2021);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=all-commits-query.spec-mongo.js.map