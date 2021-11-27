import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { connectObs, findObs } from 'observable-mongo';
import path = require('path');
import { toArray, concatMap, tap, finalize } from 'rxjs/operators';
import { loadMultiAllCommitsFiles } from './load-multi-commits-files';

describe(`loadMultiAllCommitsFiles`, () => {
    it(`load commits and files from 2 different git repos on a mongo collection`, (done) => {
        const logName_1 = 'a-git-repo';
        const logName_2 = 'a-git-repo-with-one-lazy-author';
        const logFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const logFilePath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}-commits.gitlog`);
        const clocLogPath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const clocLogPath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const dbName = 'git-metrics-test';
        let connectedClient: MongoClient;

        const commitLogPaths = [logFilePath_1, logFilePath_2];
        const clocLogPaths = [clocLogPath_1, clocLogPath_2];

        const filesCollections: string[] = [];

        loadMultiAllCommitsFiles(connectionString, commitLogPaths, clocLogPaths, dbName, 'load-multi-test-')
            .pipe(
                tap({
                    next: (notification) => {
                        expect(notification.length).equal(2);
                        filesCollections.push(notification[0].filesCollection);
                        filesCollections.push(notification[1].filesCollection);
                    },
                }),
                concatMap(() => connectObs(connectionString)),
                tap((client) => (connectedClient = client)),
                concatMap(() => findObs(connectedClient.db(dbName).collection(filesCollections[0]))),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(7);
                }),
                concatMap(() => findObs(connectedClient.db(dbName).collection(filesCollections[1]))),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(5);
                }),
                tap({
                    complete: () => {
                        // the observable returned by loadMultiAllCommitsFiles should notify only onces and therefore there have to be
                        // just 2 entries in the filesCollections array
                        expect(filesCollections.length).equal(2);
                    },
                }),
                finalize(() => connectedClient.close()),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
