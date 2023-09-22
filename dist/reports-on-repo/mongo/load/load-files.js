"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAllFilesWithCreationDate = exports.calculateAddCreationDateToFiles = exports.addCreationDateToFiles = exports.calculateCreationDateToFiles = exports.loadAllFiles = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
const mongo_config_1 = require("../config/mongo-config");
// ============================ LOAD ALL FILES ================================
// Loads all the files for each commit as documents into a mongo collection.
// Notifies ONLY ONCE an object with connString, dbName, collName, numberOfFiles loaded
// when the load operation is completed.
function loadAllFiles(connectionString, dbName, commitCollection, bufferSize = 1, logProgress = false, mongoConcurrency = 1) {
    const _filesCollectionName = `${commitCollection}-files`;
    let numberOfFileDocuments = 0;
    let numberOfFileDocumentsAccumulator = 0;
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    return ((0, observable_mongo_1.connectObs)(connectionString)
        .pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // drop the files collection if it exists
    (0, operators_1.concatMap)(() => (0, observable_mongo_1.dropCollectionObs)(_filesCollectionName, _client.db(dbName))), 
    // read the commits from the commit collection
    (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(_client.db(dbName).collection(commitCollection))), 
    // create an array of files where each file has also the details of the commit
    (0, operators_1.map)((commit) => {
        const files = [...commit.files];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const basicCommit = Object.assign({}, commit);
        delete basicCommit.files;
        delete basicCommit._id;
        const enrichedFiles = files.map((file) => (Object.assign(Object.assign({}, file), basicCommit)));
        numberOfFileDocuments = numberOfFileDocuments + enrichedFiles.length;
        return enrichedFiles;
    }), 
    // consider only the commits which have files
    (0, operators_1.filter)((enrichedFiles) => enrichedFiles.length > 0), 
    // transform the array of file documents into a stream
    (0, operators_1.concatMap)((enrichedFiles) => (0, rxjs_1.from)(enrichedFiles)), (0, operators_1.bufferCount)(bufferSize), 
    // insert the files
    (0, operators_1.mergeMap)((enrichedFiles) => {
        const db = _client.db(dbName);
        const coll = db.collection(_filesCollectionName);
        if (logProgress) {
            numberOfFileDocumentsAccumulator = numberOfFileDocumentsAccumulator + bufferSize;
            console.log(`Inserting ${numberOfFileDocumentsAccumulator} documents in files collection`);
        }
        return (0, observable_mongo_1.insertManyObs)(enrichedFiles, coll);
    }, mongoConcurrency), 
    // notify just ONCE at the end
    (0, operators_1.last)(), 
    // add the indexes
    (0, operators_1.concatMap)(() => {
        const db = _client.db(dbName);
        const coll = db.collection(_filesCollectionName);
        return (0, observable_mongo_1.createIndexObs)({ path: 1 }, null, coll);
    }), (0, operators_1.concatMap)(() => {
        const db = _client.db(dbName);
        const coll = db.collection(_filesCollectionName);
        return (0, observable_mongo_1.createIndexObs)({ authorName: 1 }, null, coll);
    }))
        // this pipe is added just to allow typescript infer the right return type
        .pipe(
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Loading of files read from ${dbName}.${commitCollection} completed`);
            console.log(`====>>>> ${numberOfFileDocuments} documents loaded into mongo db ${dbName} collection ${_filesCollectionName}`);
        },
    }), (0, operators_1.map)(() => {
        return {
            connectionString,
            dbName: dbName,
            filesCollection: _filesCollectionName,
            numberOfFilesLoaded: numberOfFileDocuments,
        };
    })));
}
exports.loadAllFiles = loadAllFiles;
// ============================ AGGREGATION DATA ================================
// The aggreate pipeline that allows to calculate the creation date for each file is coupled with the type it produces
const aggregationPipeline = [{ $group: { _id: '$path', created: { $min: '$authorDate' } } }];
// ============================ CALCULATE CREATION DATE TO FILES ================================
// Reads the files from the mongo collection and calculates the creation date for each file.
// Creation date is calculated as the date of the first commit for each file.
// Notifies just ONCE at the end the list of unique files with their creation date as well as other info related to the db
function calculateCreationDateToFiles(connectionString, dbName, filesCollection) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // read the files aggregated per file path
    (0, operators_1.concatMap)(() => (0, observable_mongo_1.aggregateObs)(_client.db(dbName).collection(filesCollection), aggregationPipeline)), (0, operators_1.toArray)(), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        next: (files) => {
            console.log(`====>>>> Calculated creation date for ${files.length} unique files read from ${dbName}.${filesCollection}`);
        },
    }), (0, operators_1.map)((filesCreationDates) => {
        const filesCreationDatesDict = {};
        filesCreationDates.forEach((f) => (filesCreationDatesDict[f._id] = f.created));
        return {
            connectionString,
            dbName: dbName,
            filesCollection,
            filesCreationDatesDict,
        };
    }));
}
exports.calculateCreationDateToFiles = calculateCreationDateToFiles;
// ============================ ADD CREATION DATE TO FILES ================================
// Adds the creation date to each file present in the mongo collection which holds the files info.
// Notifies just ONCE at the end the list of unique files with their creation date as well as other info related to the db
function addCreationDateToFiles(connectionString, dbName, filesCollection, filesCreationDatesDict, mongoConcurrency = 1) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    let fileCount = 0;
    // connects to the mongo db and drop the collection if it exists
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // create a stream of unique file paths and their relative creation date
    (0, operators_1.concatMap)(() => (0, rxjs_1.from)(Object.entries(filesCreationDatesDict))), 
    // update all documents which refer to the file (in the files collection there is one document for each file in each commit, so one file can
    // have more than one document related to it)
    (0, operators_1.mergeMap)(([path, creationDate]) => {
        const filter = { path };
        const updateInfo = { $set: { created: creationDate } };
        fileCount = fileCount + 1;
        return (0, observable_mongo_1.updateManyObs)(filter, updateInfo, _client.db(dbName).collection(filesCollection));
    }, mongoConcurrency), (0, operators_1.bufferCount)(mongo_config_1.MONGO_CONFIG.creationDateProgessMessageFrequency), (0, operators_1.tap)(() => {
        console.log(`====>>>> Creation date added for ${fileCount} files`);
    }), 
    // notify only ONCE at the end
    (0, operators_1.last)(), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        next: () => {
            console.log(`====>>>> Creation date added for files in ${dbName}.${filesCollection}`);
        },
    }), (0, operators_1.map)(() => {
        return {
            connectionString,
            dbName: dbName,
            filesCollection,
        };
    }));
}
exports.addCreationDateToFiles = addCreationDateToFiles;
// ============================ CALCUATE AND ADD CREATION DATE TO FILES ================================
// Calculates and adds the creation date to each file present in the mongo collection which holds the files info.
function calculateAddCreationDateToFiles(connectionString, dbName, filesCollection, mongoConcurrency) {
    return calculateCreationDateToFiles(connectionString, dbName, filesCollection).pipe((0, operators_1.concatMap)(({ connectionString, dbName, filesCollection, filesCreationDatesDict }) => addCreationDateToFiles(connectionString, dbName, filesCollection, filesCreationDatesDict, mongoConcurrency)));
}
exports.calculateAddCreationDateToFiles = calculateAddCreationDateToFiles;
// ============================ LOAD ALL FILES WITH THE CREATION DATE ================================
// Add all files and add to each file its creation date.
function addAllFilesWithCreationDate(connectionString, dbName, commitsCollection, mongoConcurrency) {
    return loadAllFiles(connectionString, dbName, commitsCollection, mongoConcurrency).pipe((0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => calculateAddCreationDateToFiles(connectionString, dbName, filesCollection, mongoConcurrency)), (0, operators_1.map)((resp) => (Object.assign(Object.assign({}, resp), { commitsCollection }))));
}
exports.addAllFilesWithCreationDate = addAllFilesWithCreationDate;
//# sourceMappingURL=load-files.js.map