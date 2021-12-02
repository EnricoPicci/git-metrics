/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { MongoClient } from 'mongodb';
import { Observable, from } from 'rxjs';
import { map, concatMap, bufferCount, finalize, tap, last, filter, toArray, mergeMap } from 'rxjs/operators';
import {
    aggregateObs,
    connectObs,
    createIndexObs,
    dropCollectionObs,
    findObs,
    insertManyObs,
    updateManyObs,
} from 'observable-mongo';
import { MONGO_CONFIG } from '../config/mongo-config';
import { GitCommitEnriched } from '../../1-B-git-enriched-types/git-types';

// ============================ LOAD ALL FILES ================================
// Loads all the files for each commit as documents into a mongo collection.
// Notifies ONLY ONCE an object with connString, dbName, collName, numberOfFiles loaded
// when the load operation is completed.
export function loadAllFiles(
    connectionString: string,
    dbName: string,
    commitCollection: string,
    bufferSize = 1,
    logProgress = false,
    mongoConcurrency = 1,
) {
    const _filesCollectionName = `${commitCollection}-files`;
    let numberOfFileDocuments = 0;
    let numberOfFileDocumentsAccumulator = 0;

    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return (
        connectObs(connectionString)
            .pipe(
                // save the mongo client in a local variable so that, at the end, we can close it
                tap((client) => (_client = client)),
                // drop the files collection if it exists
                concatMap(() => dropCollectionObs(_filesCollectionName, _client.db(dbName))),
                // read the commits from the commit collection
                concatMap(() => findObs(_client.db(dbName).collection(commitCollection))),
                // create an array of files where each file has also the details of the commit
                map((commit: GitCommitEnriched) => {
                    const files = [...commit.files];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const basicCommit = { ...commit } as any;
                    delete basicCommit.files;
                    delete basicCommit._id;
                    const enrichedFiles = files.map((file) => ({ ...file, ...basicCommit }));
                    numberOfFileDocuments = numberOfFileDocuments + enrichedFiles.length;
                    return enrichedFiles;
                }),
                // consider only the commits which have files
                filter((enrichedFiles) => enrichedFiles.length > 0),
                // transform the array of file documents into a stream
                concatMap((enrichedFiles) => from(enrichedFiles)),
                bufferCount(bufferSize),
                // insert the files
                mergeMap((enrichedFiles) => {
                    const db = _client.db(dbName);
                    const coll = db.collection(_filesCollectionName);
                    if (logProgress) {
                        numberOfFileDocumentsAccumulator = numberOfFileDocumentsAccumulator + bufferSize;
                        console.log(`Inserting ${numberOfFileDocumentsAccumulator} documents in files collection`);
                    }
                    return insertManyObs(enrichedFiles, coll);
                }, mongoConcurrency),
                // notify just ONCE at the end
                last(),
                // add the indexes
                concatMap(() => {
                    const db = _client.db(dbName);
                    const coll = db.collection(_filesCollectionName);
                    return createIndexObs({ path: 1 }, null, coll);
                }),
                concatMap(() => {
                    const db = _client.db(dbName);
                    const coll = db.collection(_filesCollectionName);
                    return createIndexObs({ authorName: 1 }, null, coll);
                }),
            )
            // this pipe is added just to allow typescript infer the right return type
            .pipe(
                // close the client at the end
                finalize(() => _client.close()),
                tap({
                    complete: () => {
                        console.log(`====>>>> Loading of files read from ${dbName}.${commitCollection} completed`);
                        console.log(
                            `====>>>> ${numberOfFileDocuments} documents loaded into mongo db ${dbName} collection ${_filesCollectionName}`,
                        );
                    },
                }),
                map(() => {
                    return {
                        connectionString,
                        dbName: dbName,
                        filesCollection: _filesCollectionName,
                        numberOfFilesLoaded: numberOfFileDocuments,
                    };
                }),
            )
    );
}

// ============================ AGGREGATION DATA ================================
// The aggreate pipeline that allows to calculate the creation date for each file is coupled with the type it produces
const aggregationPipeline = [{ $group: { _id: '$path', created: { $min: '$authorDate' } } }];
type fileCreationDate = {
    _id: string;
    created: Date;
};
// ============================ CALCULATE CREATION DATE TO FILES ================================
// Reads the files from the mongo collection and calculates the creation date for each file.
// Creation date is calculated as the date of the first commit for each file.
// Notifies just ONCE at the end the list of unique files with their creation date as well as other info related to the db
export function calculateCreationDateToFiles(connectionString: string, dbName: string, filesCollection: string) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the files aggregated per file path
        concatMap(
            () =>
                aggregateObs(
                    _client.db(dbName).collection(filesCollection),
                    aggregationPipeline,
                ) as Observable<fileCreationDate>,
        ),
        toArray(),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            next: (files) => {
                console.log(
                    `====>>>> Calculated creation date for ${files.length} unique files read from ${dbName}.${filesCollection}`,
                );
            },
        }),
        map((filesCreationDates) => {
            const filesCreationDatesDict: { [path: string]: Date } = {};
            filesCreationDates.forEach((f) => (filesCreationDatesDict[f._id] = f.created));
            return {
                connectionString,
                dbName: dbName,
                filesCollection,
                filesCreationDatesDict,
            };
        }),
    );
}

// ============================ ADD CREATION DATE TO FILES ================================
// Adds the creation date to each file present in the mongo collection which holds the files info.
// Notifies just ONCE at the end the list of unique files with their creation date as well as other info related to the db
export function addCreationDateToFiles(
    connectionString: string,
    dbName: string,
    filesCollection: string,
    filesCreationDatesDict: {
        [path: string]: Date;
    },
    mongoConcurrency = 1,
) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    let fileCount = 0;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // create a stream of unique file paths and their relative creation date
        concatMap(() => from(Object.entries(filesCreationDatesDict))),
        // update all documents which refer to the file (in the files collection there is one document for each file in each commit, so one file can
        // have more than one document related to it)
        mergeMap(([path, creationDate]) => {
            const filter = { path };
            const updateInfo = { $set: { created: creationDate } };
            fileCount = fileCount + 1;
            return updateManyObs(filter, updateInfo, _client.db(dbName).collection(filesCollection));
        }, mongoConcurrency),
        bufferCount(MONGO_CONFIG.creationDateProgessMessageFrequency),
        tap(() => {
            console.log(`====>>>> Creation date added for ${fileCount} files`);
        }),
        // notify only ONCE at the end
        last(),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            next: () => {
                console.log(`====>>>> Creation date added for files in ${dbName}.${filesCollection}`);
            },
        }),
        map(() => {
            return {
                connectionString,
                dbName: dbName,
                filesCollection,
            };
        }),
    );
}

// ============================ CALCUATE AND ADD CREATION DATE TO FILES ================================
// Calculates and adds the creation date to each file present in the mongo collection which holds the files info.
export function calculateAddCreationDateToFiles(
    connectionString: string,
    dbName: string,
    filesCollection: string,
    mongoConcurrency?: number,
) {
    return calculateCreationDateToFiles(connectionString, dbName, filesCollection).pipe(
        concatMap(({ connectionString, dbName, filesCollection, filesCreationDatesDict }) =>
            addCreationDateToFiles(connectionString, dbName, filesCollection, filesCreationDatesDict, mongoConcurrency),
        ),
    );
}

// ============================ LOAD ALL FILES WITH THE CREATION DATE ================================
// Add all files and add to each file its creation date.
export function addAllFilesWithCreationDate(
    connectionString: string,
    dbName: string,
    commitsCollection: string,
    mongoConcurrency?: number,
) {
    return loadAllFiles(connectionString, dbName, commitsCollection, mongoConcurrency).pipe(
        concatMap(({ connectionString, dbName, filesCollection }) =>
            calculateAddCreationDateToFiles(connectionString, dbName, filesCollection, mongoConcurrency),
        ),
        map((resp) => ({ ...resp, commitsCollection })),
    );
}
