"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMultiAllCommitsFiles = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const load_commits_files_1 = require("./load-commits-files");
// ============================ LOAD ALL COMMITS AND FILES FOR ALL REPOs PASSED IN AS PARAMETERS================================
// Loads the commit and files info as documents into a mongodb.
function loadMultiAllCommitsFiles(connectionString, commitLogPaths, clocLogPaths, dbName, commitsCollectionPrefix, bufferSize = 1, logProgress, mongoConcurrency) {
    if (commitLogPaths.length !== clocLogPaths.length) {
        throw new Error(`The number of files containing commits (${commitLogPaths.length}) is not the same as the number of files containing cloc info (${clocLogPaths.length})`);
    }
    const loadObservables = commitLogPaths.map((commitLogPath, i) => {
        const clocLogPath = clocLogPaths[i];
        const commitLogName = path_1.default.parse(commitLogPath).name;
        const _commitsCollectionPrefix = commitsCollectionPrefix !== null && commitsCollectionPrefix !== void 0 ? commitsCollectionPrefix : '';
        const commitsCollection = `${_commitsCollectionPrefix}${commitLogName}`;
        return (0, load_commits_files_1.loadAllCommitsFiles)(commitLogPath, connectionString, dbName, commitsCollection, bufferSize, clocLogPath, logProgress, mongoConcurrency);
    });
    return (0, rxjs_1.forkJoin)(loadObservables);
}
exports.loadMultiAllCommitsFiles = loadMultiAllCommitsFiles;
//# sourceMappingURL=load-multi-commits-files.js.map