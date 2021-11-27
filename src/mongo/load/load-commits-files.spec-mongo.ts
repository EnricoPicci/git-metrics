import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { connectObs, findObs } from 'observable-mongo';
import path = require('path');
import { toArray, concatMap, tap, finalize } from 'rxjs/operators';
import { loadAllCommitsFiles } from './load-commits-files';

describe(`loadAllCommitsFiles`, () => {
    it(`load commits and files on a mongo collection and notifies the number of documents loaded`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient: MongoClient;

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        let filesCollection: string;

        loadAllCommitsFiles(...params)
            .pipe(
                tap((resp) => {
                    filesCollection = resp.filesCollection;
                }),
                concatMap(() => connectObs(connectionString)),
                tap((client) => (connectedClient = client)),
                concatMap(() => findObs(connectedClient.db(logName).collection(filesCollection))),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(2749);
                }),
                finalize(() => connectedClient.close()),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
