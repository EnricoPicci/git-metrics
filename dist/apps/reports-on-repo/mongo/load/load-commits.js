"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAllCommits = exports.loadCommits = void 0;
const path = require("path");
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
const cloc_dictionary_1 = require("../../../../cloc-functions/cloc-dictionary");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
// ============================ LOAD COMMITS ================================
// Loads the commit documents into a mongo collection. Notifies at each buffer loaded the ObjectIds generated by Mongo.
// bufferSize defines the size of the buffer.
function loadCommits(commitLogPath, connectionString, dbName, commitsCollection = '', bufferSize = 1, clocLogPath, logProgress = false, mongoConcurrency = 1) {
    const _collectionName = getCommitCollName(commitsCollection, commitLogPath);
    // save the mongo client in a local variable so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    const connectAndCleanup = (0, observable_mongo_1.connectObs)(connectionString).pipe((0, operators_1.tap)((client) => (_client = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.dropCollectionObs)(_collectionName, _client.db(dbName))));
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
        ? (0, cloc_dictionary_1.clocFileDictFromClocLogFile$)(clocLogPath).pipe((0, operators_1.concatMap)((clocDict) => (0, commits_1.gitCommitStream)(commitLogPath, clocDict)), (0, operators_1.bufferCount)(bufferSize), (0, operators_1.tap)(logProgressTap))
        : (0, commits_1.gitCommitStream)(commitLogPath).pipe((0, operators_1.bufferCount)(bufferSize), (0, operators_1.tap)(logProgressTap));
    // first connect to mongo and clean
    return connectAndCleanup.pipe(
    // then switch to the stream that notifies the buffers of commits
    (0, operators_1.switchMap)(() => bufferedCommits), 
    // finally insert the buffers one after the other, in sequence, which is done via use of concatMap
    (0, operators_1.mergeMap)((commits) => {
        const db = _client.db(dbName);
        const coll = db.collection(_collectionName);
        return (0, observable_mongo_1.insertManyObs)(commits, coll);
    }, mongoConcurrency), (0, operators_1.finalize)(() => _client.close()));
}
exports.loadCommits = loadCommits;
// ============================ LOAD ALL COMMITS ================================
// Loads the commit documents into a mongo collection. Notifies ONLY ONCE an object with connString, dbName, collName, numberOfObjects loaded
// when the load operation is completed.
// bufferSize defines the size of the buffer.
function loadAllCommits(logFilePath, connectionString, dbName, commitsCollection = '', bufferSize = 1, clocLogPath, logProgress, mongoConcurrency) {
    let numberOfCommitsLoaded = 0;
    const collectionName = getCommitCollName(commitsCollection, logFilePath);
    return loadCommits(logFilePath, connectionString, dbName, commitsCollection, bufferSize, clocLogPath, logProgress, mongoConcurrency).pipe((0, operators_1.tap)((objectIds) => (numberOfCommitsLoaded = numberOfCommitsLoaded + objectIds.length)), (0, operators_1.last)(), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Loading of ${logFilePath} into mongo completed`);
            console.log(`====>>>> ${numberOfCommitsLoaded} documents loaded into mongo db ${dbName} collection ${collectionName}`);
        },
    }), (0, operators_1.map)(() => {
        return {
            connectionString,
            dbName: dbName,
            commitsCollection: collectionName,
            numberOfCommitsLoaded,
        };
    }));
}
exports.loadAllCommits = loadAllCommits;
function getCommitCollName(commitCollection, logFilePath) {
    return commitCollection ? commitCollection : path.parse(logFilePath).name;
}
//# sourceMappingURL=load-commits.js.map