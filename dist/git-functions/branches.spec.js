"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const branches_1 = require("./branches");
describe(`readBranchesGraph`, () => {
    it(`builds the git log command to read the graph of the branches`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-branches-graph.log';
        const config = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        const expectedOutfile = path_1.default.resolve(path_1.default.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --graph --date=short --pretty=medium > ${expectedOutfile}`;
        const [cmd, out] = (0, branches_1.readBranchesGraphCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`read the graphs log from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path_1.default.resolve(path_1.default.join(outDir, outFile));
        const returnedOutFilePath = (0, branches_1.readBranchesGraph)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path_1.default.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, e.g. is incremented any time the package is published
                (0, chai_1.expect)(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`defaultBranchName`, () => {
    it(`read the branch name which is the default branch to which the repo is set when cloned 
    this repos is used for the test`, (done) => {
        const thisRepoPath = './';
        (0, branches_1.defaultBranchName$)(thisRepoPath).subscribe({
            next: (branchName) => {
                (0, chai_1.expect)(branchName).equal('main');
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`lastBranch$`, () => {
    it(`read the the last branch, i.e. the branch with the last commit 
    this repo is used for the test`, (done) => {
        const thisRepoPath = './';
        (0, branches_1.lastBranch$)(thisRepoPath).subscribe({
            next: (branch) => {
                (0, chai_1.expect)(branch.branchName.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`currentBranchName$`, () => {
    it(`read current branch name for this repo`, (done) => {
        const thisRepoPath = './';
        (0, branches_1.currentBranchName$)(thisRepoPath).subscribe({
            next: (branchName) => {
                (0, chai_1.expect)(branchName).equal('main');
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=branches.spec.js.map