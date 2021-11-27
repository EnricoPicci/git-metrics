"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_mongo_1 = require("observable-mongo");
const path = require("path");
const operators_1 = require("rxjs/operators");
const load_multi_commits_files_1 = require("./load-multi-commits-files");
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
        let connectedClient;
        const commitLogPaths = [logFilePath_1, logFilePath_2];
        const clocLogPaths = [clocLogPath_1, clocLogPath_2];
        const filesCollections = [];
        (0, load_multi_commits_files_1.loadMultiAllCommitsFiles)(connectionString, commitLogPaths, clocLogPaths, dbName, 'load-multi-test-')
            .pipe((0, operators_1.tap)({
            next: (notification) => {
                (0, chai_1.expect)(notification.length).equal(2);
                filesCollections.push(notification[0].filesCollection);
                filesCollections.push(notification[1].filesCollection);
            },
        }), (0, operators_1.concatMap)(() => (0, observable_mongo_1.connectObs)(connectionString)), (0, operators_1.tap)((client) => (connectedClient = client)), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(dbName).collection(filesCollections[0]))), (0, operators_1.toArray)(), (0, operators_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(7);
        }), (0, operators_1.concatMap)(() => (0, observable_mongo_1.findObs)(connectedClient.db(dbName).collection(filesCollections[1]))), (0, operators_1.toArray)(), (0, operators_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(5);
        }), (0, operators_1.tap)({
            complete: () => {
                // the observable returned by loadMultiAllCommitsFiles should notify only onces and therefore there have to be
                // just 2 entries in the filesCollections array
                (0, chai_1.expect)(filesCollections.length).equal(2);
            },
        }), (0, operators_1.finalize)(() => connectedClient.close()))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=load-multi-commits-files.spec-mongo.js.map