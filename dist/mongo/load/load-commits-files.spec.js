"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_mongo_1 = require("observable-mongo");
const path = require("path");
const operators_1 = require("rxjs/operators");
const load_commits_files_1 = require("./load-commits-files");
describe(`loadAllCommitsFiles`, () => {
    it(`load commits and files on a mongo collection and notifies the number of documents loaded`, (done) => {
        const logName = 'io-backend-all';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient;
        const params = [logFilePath, connectionString, logName];
        let filesCollection;
        (0, load_commits_files_1.loadAllCommitsFiles)(...params)
            .pipe((0, operators_1.tap)((resp) => {
            filesCollection = resp.filesCollection;
        }), (0, operators_1.concatMap)(() => (0, observable_mongo_1.connectObs)(connectionString)), (0, operators_1.tap)((client) => (connectedClient = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(logName).collection(filesCollection))), (0, operators_1.toArray)(), (0, operators_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(2632);
        }), (0, operators_1.finalize)(() => connectedClient.close()))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=load-commits-files.spec.js.map