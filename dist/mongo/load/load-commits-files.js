"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAllCommitsFiles = void 0;
const operators_1 = require("rxjs/operators");
const load_commits_1 = require("./load-commits");
const load_files_1 = require("./load-files");
// ============================ LOAD ALL COMMITS AND FILES ================================
// Loads the commit and files info as documents into a mongo collection.
// Notifies ONLY ONCE an object with connString, dbName, collection names, number of objects loaded when the load operation is completed.
// bufferSize defines the size of the buffer.
function loadAllCommitsFiles(commitLogPath, connectionString, dbName, commitsCollection, bufferSize = 1, clocLogPath, logProgress, mongoConcurrency) {
    return (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, dbName, commitsCollection, bufferSize, clocLogPath, logProgress, mongoConcurrency).pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection, numberOfCommitsLoaded }) => 
    // then load all files
    (0, load_files_1.loadAllFiles)(connectionString, dbName, commitsCollection, bufferSize, logProgress, mongoConcurrency).pipe((0, operators_1.map)((resp) => (Object.assign(Object.assign({}, resp), { commitsCollection, numberOfCommitsLoaded }))))), (0, operators_1.concatMap)(({ connectionString, dbName, filesCollection, numberOfFilesLoaded, commitsCollection, numberOfCommitsLoaded, }) => 
    // then calculate and add the creation dates
    (0, load_files_1.calculateAddCreationDateToFiles)(connectionString, dbName, filesCollection, mongoConcurrency).pipe((0, operators_1.map)((resp) => (Object.assign(Object.assign({}, resp), { numberOfFilesLoaded, commitsCollection, numberOfCommitsLoaded }))))));
}
exports.loadAllCommitsFiles = loadAllCommitsFiles;
//# sourceMappingURL=load-commits-files.js.map