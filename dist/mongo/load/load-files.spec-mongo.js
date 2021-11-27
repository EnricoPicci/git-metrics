"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_mongo_1 = require("observable-mongo");
const path = require("path");
const operators_1 = require("rxjs/operators");
const load_commits_1 = require("./load-commits");
const load_files_1 = require("./load-files");
describe(`loadAllFiles`, () => {
    it(`load all the files as documents with data relative to their commits`, (done) => {
        const logName = 'git-repo-5-files';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.tap)(({ numberOfFilesLoaded }) => {
            (0, chai_1.expect)(numberOfFilesLoaded).equal(5);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`load all the files as documents with data relative to their commits from a real life repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.tap)(({ numberOfFilesLoaded }) => {
            (0, chai_1.expect)(numberOfFilesLoaded).equal(2749);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`load all the files as documents including the cloc info`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        let connectedClient;
        const repoName = 'io-backend';
        const commitLogPath = `./test-data/output/io-backend.gitlog`;
        const clocLogPath = `./test-data/output/io-backend-cloc.gitlog`;
        (0, load_commits_1.loadAllCommits)(commitLogPath, connectionString, repoName, null, 10, clocLogPath)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.tap)(({ numberOfFilesLoaded }) => {
            (0, chai_1.expect)(numberOfFilesLoaded).equal(2749);
        }), (0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, observable_mongo_1.connectObs)(connectionString).pipe((0, operators_1.map)((client) => ({ client, dbName, filesCollection })))), (0, operators_1.tap)(({ client }) => (connectedClient = client)), (0, operators_1.map)(({ dbName, filesCollection }) => connectedClient.db(dbName).collection(filesCollection)), (0, operators_1.concatMap)((collection) => (0, observable_mongo_1.findObs)(collection)), (0, operators_1.toArray)(), (0, operators_1.finalize)(() => connectedClient.close()), (0, operators_1.tap)((files) => {
            (0, chai_1.expect)(files.length).equal(2749);
            const aFileName = 'src/config.ts';
            const aFile = files.find((f) => f.path === aFileName);
            (0, chai_1.expect)(aFile.cloc).equals(422);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
describe(`calculateCreationDateToFiles`, () => {
    it(`calculate the creation date for all files`, (done) => {
        const logName = 'git-repo-5-files-creation-date';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => 
        // then load all files
        (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => 
        // then calculate the creation dates
        (0, load_files_1.calculateCreationDateToFiles)(connectionString, dbName, filesCollection)), (0, operators_1.tap)({
            next: (data) => {
                // check the number of unique files
                (0, chai_1.expect)(Object.keys(data.filesCreationDatesDict).length).equal(2);
                const file_1 = 'file-2.txt';
                const fileWithCreationDate_1 = data.filesCreationDatesDict[file_1];
                const creationDate = fileWithCreationDate_1;
                (0, chai_1.expect)(creationDate.getFullYear()).equal(2019);
                (0, chai_1.expect)(creationDate.getMonth() + 1).equal(7);
                (0, chai_1.expect)(creationDate.getDate()).equal(20);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`calculate the creation date for all files from a real life repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => 
        // then load all files
        (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => 
        // then calculate the creation dates
        (0, load_files_1.calculateCreationDateToFiles)(connectionString, dbName, filesCollection)), (0, operators_1.tap)({
            next: (data) => {
                // check the number of unique files
                (0, chai_1.expect)(Object.keys(data.filesCreationDatesDict).length).equal(389);
                // check for one case if the creation date is right
                const file = 'src/strategies/localStrategy.ts';
                const fileWithCreationDate = data.filesCreationDatesDict[file];
                const creationDate = fileWithCreationDate;
                (0, chai_1.expect)(creationDate.getFullYear()).equal(2020);
                (0, chai_1.expect)(creationDate.getMonth() + 1).equal(5);
                (0, chai_1.expect)(creationDate.getDate()).equal(5);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
describe(`calculateAddCreationDateToFiles`, () => {
    it(`calculate add the creation date for all files`, (done) => {
        const logName = 'git-repo-5-files-add-created';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        let _client;
        // first load the commits
        (0, load_commits_1.loadAllCommits)(...params)
            .pipe((0, operators_1.concatMap)(({ connectionString, dbName, commitsCollection: commitCollection }) => 
        // then load all files
        (0, load_files_1.loadAllFiles)(connectionString, dbName, commitCollection)), (0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => 
        // then calculate and add the creation dates
        (0, load_files_1.calculateAddCreationDateToFiles)(connectionString, dbName, filesCollection)), 
        // finally read the files collection to check that the update operation has been performed
        (0, operators_1.concatMap)(({ dbName, filesCollection }) => (0, observable_mongo_1.connectObs)(connectionString).pipe((0, operators_1.tap)((client) => (_client = client)), (0, operators_1.map)((client) => ({ client, dbName, filesCollection })))), (0, operators_1.concatMap)(({ client, dbName, filesCollection }) => (0, observable_mongo_1.findObs)(client.db(dbName).collection(filesCollection))), (0, operators_1.toArray)(), (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
            next: (files) => {
                // check the number of files
                (0, chai_1.expect)(files.length).equal(8);
                // check the creation dates
                files
                    .filter((f) => f.path === 'file-1.txt')
                    .forEach((f) => {
                    (0, chai_1.expect)(f.created.getFullYear()).equal(2019);
                    (0, chai_1.expect)(f.created.getMonth() + 1).equal(7);
                    (0, chai_1.expect)(f.created.getDate()).equal(20);
                });
                files
                    .filter((f) => f.path === 'file-2.txt')
                    .forEach((f) => {
                    (0, chai_1.expect)(f.created.getFullYear()).equal(2019);
                    (0, chai_1.expect)(f.created.getMonth() + 1).equal(7);
                    (0, chai_1.expect)(f.created.getDate()).equal(20);
                });
                files
                    .filter((f) => f.path === 'file-3.txt')
                    .forEach((f) => {
                    (0, chai_1.expect)(f.created.getFullYear()).equal(2020);
                    (0, chai_1.expect)(f.created.getMonth() + 1).equal(8);
                    (0, chai_1.expect)(f.created.getDate()).equal(19);
                });
                files
                    .filter((f) => f.path === 'file-4.txt')
                    .forEach((f) => {
                    (0, chai_1.expect)(f.created.getFullYear()).equal(2021);
                    (0, chai_1.expect)(f.created.getMonth() + 1).equal(9);
                    (0, chai_1.expect)(f.created.getDate()).equal(18);
                });
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=load-files.spec-mongo.js.map