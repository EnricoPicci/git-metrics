import { expect } from 'chai';
import { concatMap, tap, toArray } from 'rxjs';
import path from 'path';
import { loadAllCommitsFiles } from '../load/load-commits-files';
import { files } from './files-query';

describe(`files`, () => {
    it(`read the files`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits and the files
        loadAllCommitsFiles(...params)
            .pipe(
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    files(connectionString, dbName, filesCollection),
                ),
                toArray(),
                tap((files) => {
                    expect(files).not.undefined;
                    expect(files.length).equal(7);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);

    it(`read the files after a certain date`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];
        const after = new Date('2021-08-01');

        // first load the commits and the files
        loadAllCommitsFiles(...params)
            .pipe(
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    files(connectionString, dbName, filesCollection, after),
                ),
                toArray(),
                tap((files) => {
                    expect(files).not.undefined;
                    expect(files.length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
