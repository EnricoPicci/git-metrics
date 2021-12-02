import { expect } from 'chai';

import { MongoClient } from 'mongodb';
import { connectObs, findObs } from 'observable-mongo';
import path = require('path');
import { toArray, concatMap, tap, finalize } from 'rxjs/operators';
import { newGitCommit, gitCommitStream } from '../../1-B-git-enriched-streams/commits';
import { loadAllCommits } from './load-commits';

describe(`newCommitDoc`, () => {
    it(`returns the info related to a specific commit in the form of a document`, () => {
        // raw data about a commit retrieved with git log
        const rawCommitData = [
            '§§§423e964§§§2021-08-28§§§Picci§§§Picci§§§2021-09-10§§§First commit§§§19145c3',
            '1	2	file-1.txt',
            '3	4	file-2.txt',
        ];
        const doc = newGitCommit(rawCommitData);
        expect(doc.hashShort).equal('423e964');
        expect(doc.committerDate.getFullYear()).equal(2021);
        expect(doc.committerDate.getMonth()).equal(8);
        expect(doc.committerDate.getDate()).equal(10);
        expect(doc.authorName).equal('Picci');
        expect(doc.files.length).equal(2);
        expect(doc.files[0].linesAdded).equal(1);
        expect(doc.files[0].linesDeleted).equal(2);
        expect(doc.files[0].path).equal('file-1.txt');
        expect(doc.files[1].linesAdded).equal(3);
        expect(doc.files[1].linesDeleted).equal(4);
        expect(doc.files[1].path).equal('file-2.txt');
    });
    it(`returns the info related to a specific commit even if there are no files`, () => {
        // raw data about a commit retrieved with git log
        const rawCommitData = ['§§§423e964§§§2021-08-28§§§Picci§§§Picci§§§2021-09-10§§§First commit§§§19145c3'];
        const doc = newGitCommit(rawCommitData);
        expect(doc.hashShort).equal('423e964');
        expect(doc.committerDate.getFullYear()).equal(2021);
        expect(doc.committerDate.getMonth()).equal(8);
        expect(doc.committerDate.getDate()).equal(10);
        expect(doc.authorName).equal('Picci');
        expect(doc.files.length).equal(0);
    });
});

describe(`splitCommitDocs`, () => {
    it(`returns a stream of commitDocs`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        gitCommitStream(logFilePath)
            .pipe(toArray())
            .subscribe({
                next: (commits) => {
                    expect(commits.length).equal(3);
                    // top commit
                    expect(commits[0].hashShort).equal('423e964');
                    expect(commits[0].authorName).equal('Picci-1');
                    expect(commits[0].committerDate.getFullYear()).equal(2021);
                    expect(commits[0].committerDate.getMonth() + 1).equal(9);
                    expect(commits[0].committerDate.getDate()).equal(10);
                    expect(commits[0].files.length).equal(2);
                    // top commit - first commit
                    expect(commits[0].files[0].linesAdded).equal(5);
                    expect(commits[0].files[0].linesDeleted).equal(3);
                    expect(commits[0].files[0].path).equal('file-1.txt');
                    // top commit - second file
                    expect(commits[0].files[1].linesAdded).equal(4);
                    expect(commits[0].files[1].linesDeleted).equal(2);
                    expect(commits[0].files[1].path).equal('file-2.txt');
                    // middle commit
                    expect(commits[1].hashShort).equal('fcf4bfc');
                    expect(commits[1].authorName).equal('Picci-2');
                    expect(commits[1].committerDate.getFullYear()).equal(2021);
                    expect(commits[1].committerDate.getMonth() + 1).equal(9);
                    expect(commits[1].committerDate.getDate()).equal(10);
                    expect(commits[1].files.length).equal(1);
                    // only file of middle commit
                    expect(commits[1].files[0].linesAdded).equal(3);
                    expect(commits[1].files[0].linesDeleted).equal(1);
                    expect(commits[1].files[0].path).equal('file-1.txt');
                    // bottom commit
                    expect(commits[2].hashShort).equal('8b12bad');
                    expect(commits[2].authorName).equal('Picci-3');
                    expect(commits[2].committerDate.getFullYear()).equal(2021);
                    expect(commits[2].committerDate.getMonth() + 1).equal(9);
                    expect(commits[2].committerDate.getDate()).equal(10);
                    expect(commits[2].files.length).equal(2);
                    // bottom commit - first commit
                    expect(commits[2].files[0].linesAdded).equal(2);
                    expect(commits[2].files[0].linesDeleted).equal(0);
                    expect(commits[2].files[0].path).equal('file-1.txt');
                    // bottom commit - second file
                    expect(commits[2].files[1].linesAdded).equal(1);
                    expect(commits[2].files[1].linesDeleted).equal(0);
                    expect(commits[2].files[1].path).equal('file-2.txt');
                },
                complete: () => done(),
            });
    });
    it(`returns a stream of commitDocs with the commit subject`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/log-with-body-in-message.gitlog');
        gitCommitStream(logFilePath)
            .pipe(toArray())
            .subscribe({
                next: (commits) => {
                    expect(commits.length).equal(3);
                    // top commit
                    expect(commits[0].hashShort).equal('67bfd68');
                    expect(commits[0].authorName).equal('gquadrati');
                    expect(commits[0].committerDate.getFullYear()).equal(2021);
                    expect(commits[0].committerDate.getMonth() + 1).equal(6);
                    expect(commits[0].committerDate.getDate()).equal(8);
                    expect(commits[0].committerName).equal('gquadrati');
                    expect(commits[0].committerDate.getFullYear()).equal(2021);
                    expect(commits[0].committerDate.getMonth() + 1).equal(6);
                    expect(commits[0].committerDate.getDate()).equal(8);
                    expect(commits[0].subject).equal(`Merge remote-tracking branch 'origin/master' into IP-205`);
                    expect(commits[0].files.length).equal(0);
                },
                complete: () => done(),
            });
    });
    it(`simply run the method - used to check quickly if error arise with a big real world log`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/io-backend.gitlog');
        gitCommitStream(logFilePath).subscribe({
            complete: () => done(),
        });
    });
});

describe(`loadCommits`, () => {
    it(`load commits on a mongo collection and notifies the number of documents loaded`, (done) => {
        const logName = 'git-repo-2-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient: MongoClient;

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        loadAllCommits(...params)
            .pipe(
                tap(({ numberOfCommitsLoaded }) => {
                    expect(numberOfCommitsLoaded).equal(2);
                }),
                concatMap(() => connectObs(connectionString)),
                tap((client) => (connectedClient = client)),
                concatMap(() => findObs(connectedClient.db(logName).collection(logName))),
                toArray(),
                tap((commits) => {
                    expect(commits.length).equal(2);
                }),
                finalize(() => connectedClient.close()),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`load commits in buffered chunks`, (done) => {
        const logName = 'git-repo-3-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient: MongoClient;

        loadAllCommits(logFilePath, connectionString, logName, null, 2)
            .pipe(
                tap(({ connectionString, dbName, commitsCollection: commitCollection, numberOfCommitsLoaded }) => {
                    expect(connectionString).equal(connectionString);
                    expect(dbName).equal(logName);
                    expect(commitCollection).equal(logName);
                    expect(numberOfCommitsLoaded).equal(3);
                }),
                concatMap(() => connectObs(connectionString)),
                tap((client) => (connectedClient = client)),
                concatMap(() => findObs(connectedClient.db(logName).collection(logName))),
                toArray(),
                tap((commits) => {
                    expect(commits.length).equal(3);
                }),
                finalize(() => connectedClient.close()),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`load commits with cloc info`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient: MongoClient;

        const repoName = 'io-backend';
        const commitLogPath = `./test-data/output/io-backend.gitlog`;
        const clocLogPath = `./test-data/output/io-backend-cloc.gitlog`;

        let _commitsCollection: string;

        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                concatMap(({ commitsCollection }) => {
                    _commitsCollection = commitsCollection;
                    return connectObs(connectionString);
                }),
                tap((client) => (connectedClient = client)),
                concatMap(() => findObs(connectedClient.db(repoName).collection(_commitsCollection))),
                toArray(),
                tap((commits) => {
                    const aCommit = commits.find((c) => c.hashShort === 'cba421d');
                    expect(aCommit.files[0].cloc).equal(100);
                }),
                finalize(() => connectedClient.close()),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
