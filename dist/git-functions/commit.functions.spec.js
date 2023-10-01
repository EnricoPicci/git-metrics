"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const commit_functions_1 = require("./commit.functions");
const rxjs_1 = require("rxjs");
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
describe('readCommitFromLog$', () => {
    it('should throw an error if repoPath is not provided', () => {
        (0, chai_1.expect)(() => (0, commit_functions_1.readCommitFromLog$)('')).to.throw();
    });
    it('should return a stream of commit objects from this repo', (done) => {
        (0, commit_functions_1.readCommitFromLog$)('./').pipe((0, rxjs_1.toArray)()).subscribe((commits) => {
            (0, chai_1.expect)(commits instanceof Array).to.be.true;
            (0, chai_1.expect)(commits.length).greaterThan(0);
            const firstCommit = commits[commits.length - 1];
            (0, chai_1.expect)(firstCommit.sha).equal('8767d5864e7d72df0f25915fe8e0652244eee5fa');
            (0, chai_1.expect)(!!firstCommit.date).to.be.true;
            (0, chai_1.expect)(!!firstCommit.author).to.be.true;
            // this tests that the sha is a real sha and not something else
            const lastCommit = commits[0];
            (0, chai_1.expect)(lastCommit.sha.includes(' ')).to.be.false;
            done();
        });
    });
});
describe('readOneCommitFromLog$', () => {
    it('should throw an error if an not existing sha is provided', (done) => {
        const notExistingCommitSha = 'abc';
        const repoPath = './';
        (0, commit_functions_1.readOneCommitFromLog$)(notExistingCommitSha, repoPath, false).subscribe({
            next: () => {
                done('should not return a value');
            },
            error: (error) => {
                (0, chai_1.expect)(error instanceof Error).to.be.true;
                done();
            },
            complete: () => {
                done('should not complete');
            }
        });
    });
    it('should notify the first commit object of this repo', (done) => {
        const firstCommitOfThisRepo = '8767d5864e7d72df0f25915fe8e0652244eee5fa';
        const repoPath = './';
        (0, commit_functions_1.readOneCommitFromLog$)(firstCommitOfThisRepo, repoPath, false).subscribe({
            next: (commitCompact) => {
                (0, chai_1.expect)(commitCompact.sha).equal(firstCommitOfThisRepo);
                done();
            },
            error: (error) => {
                done(error);
            },
        });
    });
});
describe(`writeCommitLog`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config = {
            repoFolderPath: './',
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path_1.default.resolve(path_1.default.join(outDir, outFile));
        const returnedOutFilePath = (0, commit_functions_1.writeCommitLog)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path_1.default.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                // one line for the commit and one line for each file
                // if we change and commit those files again this test will have to be adjusted
                // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                // we read from
                (0, chai_1.expect)(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=commit.functions.spec.js.map