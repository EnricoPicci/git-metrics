import { expect } from 'chai';
import { concatMap, tap, toArray } from 'rxjs';
import path from 'path';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { fileChurn } from './file-churn-query';

describe(`filesChurn`, () => {
    it(`calculates the total number of lines added and deleted for each file`, (done) => {
        const logName = 'git-repo-5-files-churn';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    fileChurn(connectionString, dbName, filesCollection),
                ),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(2);
                    const f1 = files.find((f) => f.path === 'file-1.txt');
                    expect(f1.linesAdded).equal(10);
                    expect(f1.linesDeleted).equal(4);
                    expect(f1.linesAddDel).equal(14);
                    expect(f1.commits).equal(3);
                    expect(f1.created.getFullYear()).equal(2019);
                    expect(f1.created.getMonth() + 1).equal(7);
                    expect(f1.created.getDate()).equal(20);
                    const f2 = files.find((f) => f.path === 'file-2.txt');
                    expect(f2.linesAdded).equal(5);
                    expect(f2.linesDeleted).equal(2);
                    expect(f2.linesAddDel).equal(7);
                    expect(f2.commits).equal(2);
                    expect(f2.created.getFullYear()).equal(2019);
                    expect(f2.created.getMonth() + 1).equal(7);
                    expect(f2.created.getDate()).equal(20);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`calculates the total number of lines added and deleted for each file after a certain date`, (done) => {
        const logName = 'git-repo-5-files-churn';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        const after = new Date('2020-08-19');

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    fileChurn(connectionString, dbName, filesCollection, after),
                ),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(2);
                    const f1 = files.find((f) => f.path === 'file-1.txt');
                    expect(f1.linesAdded).equal(8);
                    expect(f1.linesDeleted).equal(4);
                    expect(f1.commits).equal(2);
                    expect(f1.created.getFullYear()).equal(2019);
                    expect(f1.created.getMonth() + 1).equal(7);
                    expect(f1.created.getDate()).equal(20);
                    const f2 = files.find((f) => f.path === 'file-2.txt');
                    expect(f2.linesAdded).equal(4);
                    expect(f2.linesDeleted).equal(2);
                    expect(f2.commits).equal(1);
                    expect(f2.created.getFullYear()).equal(2019);
                    expect(f2.created.getMonth() + 1).equal(7);
                    expect(f2.created.getDate()).equal(20);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`calculates the total number of lines added and deleted for each file from a real world repo`, (done) => {
        const logName = 'io-backend';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    fileChurn(connectionString, dbName, filesCollection),
                ),
                toArray(),
                tap((files) => {
                    expect(files.length).equal(389);
                    const f1 = files.find((f) => f.path === 'src/utils/APICredential.ts');
                    expect(f1.linesAdded).equal(41);
                    expect(f1.linesDeleted).equal(41);
                    expect(f1.commits).equal(4);
                    expect(f1.created.getFullYear()).equal(2018);
                    expect(f1.created.getMonth() + 1).equal(2);
                    expect(f1.created.getDate()).equal(23);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
