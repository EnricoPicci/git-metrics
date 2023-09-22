"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_mongo_1 = require("observable-mongo");
const path = require("path");
const operators_1 = require("rxjs/operators");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const load_commits_1 = require("./load-commits");
describe(`newCommitDoc`, () => {
    it(`returns the info related to a specific commit in the form of a document`, () => {
        // raw data about a commit retrieved with git log
        const rawCommitData = [
            '§§§423e964§§§2021-08-28§§§Picci§§§Picci§§§2021-09-10§§§First commit§§§19145c3',
            '1	2	file-1.txt',
            '3	4	file-2.txt',
        ];
        const doc = (0, commits_1.newGitCommit)(rawCommitData);
        (0, chai_1.expect)(doc.hashShort).equal('423e964');
        (0, chai_1.expect)(doc.committerDate.getFullYear()).equal(2021);
        (0, chai_1.expect)(doc.committerDate.getMonth()).equal(8);
        (0, chai_1.expect)(doc.committerDate.getDate()).equal(10);
        (0, chai_1.expect)(doc.authorName).equal('Picci');
        (0, chai_1.expect)(doc.files.length).equal(2);
        (0, chai_1.expect)(doc.files[0].linesAdded).equal(1);
        (0, chai_1.expect)(doc.files[0].linesDeleted).equal(2);
        (0, chai_1.expect)(doc.files[0].path).equal('file-1.txt');
        (0, chai_1.expect)(doc.files[1].linesAdded).equal(3);
        (0, chai_1.expect)(doc.files[1].linesDeleted).equal(4);
        (0, chai_1.expect)(doc.files[1].path).equal('file-2.txt');
    });
    it(`returns the info related to a specific commit even if there are no files`, () => {
        // raw data about a commit retrieved with git log
        const rawCommitData = ['§§§423e964§§§2021-08-28§§§Picci§§§Picci§§§2021-09-10§§§First commit§§§19145c3'];
        const doc = (0, commits_1.newGitCommit)(rawCommitData);
        (0, chai_1.expect)(doc.hashShort).equal('423e964');
        (0, chai_1.expect)(doc.committerDate.getFullYear()).equal(2021);
        (0, chai_1.expect)(doc.committerDate.getMonth()).equal(8);
        (0, chai_1.expect)(doc.committerDate.getDate()).equal(10);
        (0, chai_1.expect)(doc.authorName).equal('Picci');
        (0, chai_1.expect)(doc.files.length).equal(0);
    });
});
describe(`splitCommitDocs`, () => {
    it(`returns a stream of commitDocs`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        (0, commits_1.gitCommitStream)(logFilePath)
            .pipe((0, operators_1.toArray)())
            .subscribe({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).equal(3);
                // top commit
                (0, chai_1.expect)(commits[0].hashShort).equal('423e964');
                (0, chai_1.expect)(commits[0].authorName).equal('Picci-1');
                (0, chai_1.expect)(commits[0].committerDate.getFullYear()).equal(2021);
                (0, chai_1.expect)(commits[0].committerDate.getMonth() + 1).equal(9);
                (0, chai_1.expect)(commits[0].committerDate.getDate()).equal(10);
                (0, chai_1.expect)(commits[0].files.length).equal(2);
                // top commit - first commit
                (0, chai_1.expect)(commits[0].files[0].linesAdded).equal(5);
                (0, chai_1.expect)(commits[0].files[0].linesDeleted).equal(3);
                (0, chai_1.expect)(commits[0].files[0].path).equal('file-1.txt');
                // top commit - second file
                (0, chai_1.expect)(commits[0].files[1].linesAdded).equal(4);
                (0, chai_1.expect)(commits[0].files[1].linesDeleted).equal(2);
                (0, chai_1.expect)(commits[0].files[1].path).equal('file-2.txt');
                // middle commit
                (0, chai_1.expect)(commits[1].hashShort).equal('fcf4bfc');
                (0, chai_1.expect)(commits[1].authorName).equal('Picci-2');
                (0, chai_1.expect)(commits[1].committerDate.getFullYear()).equal(2021);
                (0, chai_1.expect)(commits[1].committerDate.getMonth() + 1).equal(9);
                (0, chai_1.expect)(commits[1].committerDate.getDate()).equal(10);
                (0, chai_1.expect)(commits[1].files.length).equal(1);
                // only file of middle commit
                (0, chai_1.expect)(commits[1].files[0].linesAdded).equal(3);
                (0, chai_1.expect)(commits[1].files[0].linesDeleted).equal(1);
                (0, chai_1.expect)(commits[1].files[0].path).equal('file-1.txt');
                // bottom commit
                (0, chai_1.expect)(commits[2].hashShort).equal('8b12bad');
                (0, chai_1.expect)(commits[2].authorName).equal('Picci-3');
                (0, chai_1.expect)(commits[2].committerDate.getFullYear()).equal(2021);
                (0, chai_1.expect)(commits[2].committerDate.getMonth() + 1).equal(9);
                (0, chai_1.expect)(commits[2].committerDate.getDate()).equal(10);
                (0, chai_1.expect)(commits[2].files.length).equal(2);
                // bottom commit - first commit
                (0, chai_1.expect)(commits[2].files[0].linesAdded).equal(2);
                (0, chai_1.expect)(commits[2].files[0].linesDeleted).equal(0);
                (0, chai_1.expect)(commits[2].files[0].path).equal('file-1.txt');
                // bottom commit - second file
                (0, chai_1.expect)(commits[2].files[1].linesAdded).equal(1);
                (0, chai_1.expect)(commits[2].files[1].linesDeleted).equal(0);
                (0, chai_1.expect)(commits[2].files[1].path).equal('file-2.txt');
            },
            complete: () => done(),
        });
    });
    it(`returns a stream of commitDocs with the commit subject`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/log-with-body-in-message.gitlog');
        (0, commits_1.gitCommitStream)(logFilePath)
            .pipe((0, operators_1.toArray)())
            .subscribe({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).equal(3);
                // top commit
                (0, chai_1.expect)(commits[0].hashShort).equal('67bfd68');
                (0, chai_1.expect)(commits[0].authorName).equal('gquadrati');
                (0, chai_1.expect)(commits[0].committerDate.getFullYear()).equal(2021);
                (0, chai_1.expect)(commits[0].committerDate.getMonth() + 1).equal(6);
                (0, chai_1.expect)(commits[0].committerDate.getDate()).equal(8);
                (0, chai_1.expect)(commits[0].committerName).equal('gquadrati');
                (0, chai_1.expect)(commits[0].committerDate.getFullYear()).equal(2021);
                (0, chai_1.expect)(commits[0].committerDate.getMonth() + 1).equal(6);
                (0, chai_1.expect)(commits[0].committerDate.getDate()).equal(8);
                (0, chai_1.expect)(commits[0].subject).equal(`Merge remote-tracking branch 'origin/master' into IP-205`);
                (0, chai_1.expect)(commits[0].files.length).equal(0);
            },
            complete: () => done(),
        });
    });
    it(`simply run the method - used to check quickly if error arise with a big real world log`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/io-backend.gitlog');
        (0, commits_1.gitCommitStream)(logFilePath).subscribe({
            complete: () => done(),
        });
    });
});
describe(`loadCommits`, () => {
    it(`load commits on a mongo collection and notifies the number of documents loaded`, (done) => {
        const logName = 'git-repo-2-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient;
        const params = [logFilePath, connectionString, logName];
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.tap)(({ numberOfCommitsLoaded }) => {
            (0, chai_1.expect)(numberOfCommitsLoaded).equal(2);
        }), (0, operators_1.concatMap)(() => (0, observable_mongo_1.connectObs)(connectionString)), (0, operators_1.tap)((client) => (connectedClient = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(logName).collection(logName))), (0, operators_1.toArray)(), (0, operators_1.tap)((commits) => {
            (0, chai_1.expect)(commits.length).equal(2);
        }), (0, operators_1.finalize)(() => connectedClient.close()))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`load commits in buffered chunks`, (done) => {
        const logName = 'git-repo-3-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient;
        (0, load_commits_1.loadAllCommits)(logFilePath, connectionString, logName, '', 2)
            .pipe((0, operators_1.tap)(({ connectionString, dbName, commitsCollection: commitCollection, numberOfCommitsLoaded }) => {
            (0, chai_1.expect)(connectionString).equal(connectionString);
            (0, chai_1.expect)(dbName).equal(logName);
            (0, chai_1.expect)(commitCollection).equal(logName);
            (0, chai_1.expect)(numberOfCommitsLoaded).equal(3);
        }), (0, operators_1.concatMap)(() => (0, observable_mongo_1.connectObs)(connectionString)), (0, operators_1.tap)((client) => (connectedClient = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(logName).collection(logName))), (0, operators_1.toArray)(), (0, operators_1.tap)((commits) => {
            (0, chai_1.expect)(commits.length).equal(3);
        }), (0, operators_1.finalize)(() => connectedClient.close()))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`load commits with cloc info`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient;
        const repoName = 'io-backend';
        const commitLogPath = `./test-data/output/io-backend.gitlog`;
        const clocLogPath = `./test-data/output/io-backend-cloc.gitlog`;
        let _commitsCollection;
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe((0, operators_1.concatMap)(({ commitsCollection }) => {
            _commitsCollection = commitsCollection;
            return (0, observable_mongo_1.connectObs)(connectionString);
        }), (0, operators_1.tap)((client) => (connectedClient = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(repoName).collection(_commitsCollection))), (0, operators_1.toArray)(), (0, operators_1.tap)((commits) => {
            const aCommit = commits.find((c) => c.hashShort === 'cba421d');
            (0, chai_1.expect)(aCommit.files[0].cloc).equal(100);
        }), (0, operators_1.finalize)(() => connectedClient.close()))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=load-commits.spec-mongo.js.map