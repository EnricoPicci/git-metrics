"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const chai_1 = require("chai");
const git_read_enrich_1 = require("./git-read-enrich");
describe(`gitReadEnrich`, () => {
    it(`returns stream of GitCommitEnriched and a stream of FileGitCommitEnriched objects using this project as source repo since this
    project folder contains a .git repo`, (done) => {
        const repoFolderPath = './';
        const filter = ['*.ts'];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits.log';
        const [commits, fileCommits] = (0, git_read_enrich_1.gitReadEnrich)(repoFolderPath, filter, outDir, outFile);
        commits
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).gt(0);
                const aCommit = commits[0];
                (0, chai_1.expect)(aCommit.committerDate).not.undefined;
                (0, chai_1.expect)(aCommit.authorName).not.undefined;
                (0, chai_1.expect)(aCommit.committerDate).not.undefined;
                (0, chai_1.expect)(aCommit.committerName).not.undefined;
                (0, chai_1.expect)(aCommit.files).not.undefined;
                (0, chai_1.expect)(Array.isArray(aCommit.files)).true;
                (0, chai_1.expect)(aCommit.hashShort).not.undefined;
                (0, chai_1.expect)(aCommit.parents).not.undefined;
                (0, chai_1.expect)(Array.isArray(aCommit.parents)).true;
                //
                const aSecondCommit = commits[1];
                (0, chai_1.expect)(Array.isArray(aSecondCommit.parents)).true;
            },
        }), (0, rxjs_1.concatMap)(() => fileCommits), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (fileCommits) => {
                (0, chai_1.expect)(fileCommits.length).gt(0);
                const aFileCommit = fileCommits[0];
                (0, chai_1.expect)(aFileCommit.committerDate).not.undefined;
                (0, chai_1.expect)(aFileCommit.authorName).not.undefined;
                (0, chai_1.expect)(aFileCommit.committerDate).not.undefined;
                (0, chai_1.expect)(aFileCommit.committerName).not.undefined;
                (0, chai_1.expect)(aFileCommit.hashShort).not.undefined;
                (0, chai_1.expect)(aFileCommit.path).not.undefined;
            },
        }))
            .subscribe({
            complete: () => done(),
        });
    }).timeout(20000);
});
describe(`gitReadCommitEnrich`, () => {
    it(`returns stream of GitCommitEnriched objects in reverse order using this project as source repo since this
    project folder contains a .git repo`, (done) => {
        const repoFolderPath = './';
        const filter = ['*.ts'];
        const outDir = './temp';
        const outFile = 'this-git-repo-commits.log';
        const reverse = true;
        const commits = (0, git_read_enrich_1.gitReadCommitEnrich)(repoFolderPath, filter, outDir, outFile, null, null, reverse);
        commits
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).gt(0);
                const eldestCommit = commits[0];
                const youngestCommit = commits[commits.length - 1];
                (0, chai_1.expect)(eldestCommit.committerDate <= youngestCommit.committerDate).true;
            },
        }))
            .subscribe({
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=git-read-enrich.spec.js.map