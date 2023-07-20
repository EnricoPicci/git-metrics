import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { connectObs, findObs } from 'observable-mongo';
import path = require('path');
import { toArray, concatMap, tap, finalize, map } from 'rxjs/operators';
import { loadAllCommits } from './load-commits';
import { calculateAddCreationDateToFiles, calculateCreationDateToFiles, loadAllFiles } from './load-files';

describe(`loadAllFiles`, () => {
    it(`load all the files as documents with data relative to their commits`, (done) => {
        const logName = 'git-repo-5-files';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                tap(({ numberOfFilesLoaded }) => {
                    expect(numberOfFilesLoaded).equal(5);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`load all the files as documents with data relative to their commits from a real life repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                tap(({ numberOfFilesLoaded }) => {
                    expect(numberOfFilesLoaded).equal(2749);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`load all the files as documents including the cloc info`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient: MongoClient;

        const repoName = 'io-backend';
        const commitLogPath = `./test-data/output/io-backend.gitlog`;
        const clocLogPath = `./test-data/output/io-backend-cloc.gitlog`;

        loadAllCommits(commitLogPath, connectionString, repoName, null, 10, clocLogPath)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                tap(({ numberOfFilesLoaded }) => {
                    expect(numberOfFilesLoaded).equal(2749);
                }),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    connectObs(connectionString).pipe(map((client) => ({ client, dbName, filesCollection }))),
                ),
                tap(({ client }) => (connectedClient = client)),
                map(({ dbName, filesCollection }) => connectedClient.db(dbName).collection(filesCollection)),
                concatMap((collection) => findObs(collection)),
                toArray(),
                finalize(() => connectedClient.close()),
                tap((files) => {
                    expect(files.length).equal(2749);
                    const aFileName = 'src/config.ts';
                    const aFile = files.find((f) => f.path === aFileName);
                    expect(aFile.cloc).equals(422);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`calculateCreationDateToFiles`, () => {
    it(`calculate the creation date for all files`, (done) => {
        const logName = 'git-repo-5-files-creation-date';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    // then load all files
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    // then calculate the creation dates
                    calculateCreationDateToFiles(connectionString, dbName, filesCollection),
                ),
                tap({
                    next: (data) => {
                        // check the number of unique files
                        expect(Object.keys(data.filesCreationDatesDict).length).equal(2);
                        const file_1 = 'file-2.txt';
                        const fileWithCreationDate_1 = data.filesCreationDatesDict[file_1];
                        const creationDate = fileWithCreationDate_1;
                        expect(creationDate.getFullYear()).equal(2019);
                        expect(creationDate.getMonth() + 1).equal(7);
                        expect(creationDate.getDate()).equal(20);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`calculate the creation date for all files from a real life repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    // then load all files
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    // then calculate the creation dates
                    calculateCreationDateToFiles(connectionString, dbName, filesCollection),
                ),
                tap({
                    next: (data) => {
                        // check the number of unique files
                        expect(Object.keys(data.filesCreationDatesDict).length).equal(389);
                        // check for one case if the creation date is right
                        const file = 'src/strategies/localStrategy.ts';
                        const fileWithCreationDate = data.filesCreationDatesDict[file];
                        const creationDate = fileWithCreationDate;
                        expect(creationDate.getFullYear()).equal(2020);
                        expect(creationDate.getMonth() + 1).equal(5);
                        expect(creationDate.getDate()).equal(5);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`calculateAddCreationDateToFiles`, () => {
    it(`calculate add the creation date for all files`, (done) => {
        const logName = 'git-repo-5-files-add-created';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];
        let _client: MongoClient;

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    // then load all files
                    loadAllFiles(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    // then calculate and add the creation dates
                    calculateAddCreationDateToFiles(connectionString, dbName, filesCollection),
                ),
                // finally read the files collection to check that the update operation has been performed
                concatMap(({ dbName, filesCollection }) =>
                    connectObs(connectionString).pipe(
                        tap((client) => (_client = client)),
                        map((client) => ({ client, dbName, filesCollection })),
                    ),
                ),
                concatMap(({ client, dbName, filesCollection }) =>
                    findObs(client.db(dbName).collection(filesCollection)),
                ),
                toArray(),
                finalize(() => _client.close()),
                tap({
                    next: (files) => {
                        // check the number of files
                        expect(files.length).equal(8);
                        // check the creation dates
                        files
                            .filter((f) => f.path === 'file-1.txt')
                            .forEach((f) => {
                                expect(f.created.getFullYear()).equal(2019);
                                expect(f.created.getMonth() + 1).equal(7);
                                expect(f.created.getDate()).equal(20);
                            });
                        files
                            .filter((f) => f.path === 'file-2.txt')
                            .forEach((f) => {
                                expect(f.created.getFullYear()).equal(2019);
                                expect(f.created.getMonth() + 1).equal(7);
                                expect(f.created.getDate()).equal(20);
                            });
                        files
                            .filter((f) => f.path === 'file-3.txt')
                            .forEach((f) => {
                                expect(f.created.getFullYear()).equal(2020);
                                expect(f.created.getMonth() + 1).equal(8);
                                expect(f.created.getDate()).equal(19);
                            });
                        files
                            .filter((f) => f.path === 'file-4.txt')
                            .forEach((f) => {
                                expect(f.created.getFullYear()).equal(2021);
                                expect(f.created.getMonth() + 1).equal(9);
                                expect(f.created.getDate()).equal(18);
                            });
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
