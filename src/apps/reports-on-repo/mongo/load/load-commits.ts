/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import path = require('path');
import { MongoClient } from 'mongodb';
import { map, concatMap, bufferCount, switchMap, finalize, tap, last, mergeMap } from 'rxjs/operators';
import { connectObs, dropCollectionObs, insertManyObs } from 'observable-mongo';
import { clocFileDict } from '../../1-B-git-enriched-streams/read-cloc-log';
import { gitCommitStream } from '../../1-B-git-enriched-streams/commits';

// ============================ LOAD COMMITS ================================
// Loads the commit documents into a mongo collection. Notifies at each buffer loaded the ObjectIds generated by Mongo.
// bufferSize defines the size of the buffer.
export function loadCommits(
    commitLogPath: string,
    connectionString: string,
    dbName: string,
    commitsCollection = '',
    bufferSize = 1,
    clocLogPath?: string,
    logProgress = false,
    mongoConcurrency = 1,
) {
    const _collectionName = getCommitCollName(commitsCollection, commitLogPath);

    // save the mongo client in a local variable so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    const connectAndCleanup = connectObs(connectionString).pipe(
        tap((client) => (_client = client)),
        concatMap(() => dropCollectionObs(_collectionName, _client.db(dbName))),
    );
    // stream of buffers of commits
    let numOfCommits = 0;
    const logProgressTap = {
        next: () => {
            if (logProgress) {
                numOfCommits = numOfCommits + bufferSize;
                console.log(`====>>>> ${numOfCommits} commits loaded`);
            }
        },
    };
    const bufferedCommits = clocLogPath
        ? clocFileDict(clocLogPath).pipe(
            concatMap((clocDict) => gitCommitStream(commitLogPath, clocDict)),
            bufferCount(bufferSize),
            tap(logProgressTap),
        )
        : gitCommitStream(commitLogPath).pipe(bufferCount(bufferSize), tap(logProgressTap));
    // first connect to mongo and clean
    return connectAndCleanup.pipe(
        // then switch to the stream that notifies the buffers of commits
        switchMap(() => bufferedCommits),
        // finally insert the buffers one after the other, in sequence, which is done via use of concatMap
        mergeMap((commits) => {
            const db = _client.db(dbName);
            const coll = db.collection(_collectionName);
            return insertManyObs(commits, coll);
        }, mongoConcurrency),
        finalize(() => _client.close()),
    );
}

// ============================ LOAD ALL COMMITS ================================
// Loads the commit documents into a mongo collection. Notifies ONLY ONCE an object with connString, dbName, collName, numberOfObjects loaded
// when the load operation is completed.
// bufferSize defines the size of the buffer.
export function loadAllCommits(
    logFilePath: string,
    connectionString: string,
    dbName: string,
    commitsCollection = '',
    bufferSize = 1,
    clocLogPath?: string,
    logProgress?: boolean,
    mongoConcurrency?: number,
) {
    let numberOfCommitsLoaded = 0;
    const collectionName = getCommitCollName(commitsCollection, logFilePath);
    return loadCommits(
        logFilePath,
        connectionString,
        dbName,
        commitsCollection,
        bufferSize,
        clocLogPath,
        logProgress,
        mongoConcurrency,
    ).pipe(
        tap((objectIds) => (numberOfCommitsLoaded = numberOfCommitsLoaded + objectIds.length)),
        last(),
        tap({
            complete: () => {
                console.log(`====>>>> Loading of ${logFilePath} into mongo completed`);
                console.log(
                    `====>>>> ${numberOfCommitsLoaded} documents loaded into mongo db ${dbName} collection ${collectionName}`,
                );
            },
        }),
        map(() => {
            return {
                connectionString,
                dbName: dbName,
                commitsCollection: collectionName,
                numberOfCommitsLoaded,
            };
        }),
    );
}

function getCommitCollName(commitCollection: string, logFilePath: string) {
    return commitCollection ? commitCollection : path.parse(logFilePath).name;
}