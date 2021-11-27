import { expect } from 'chai';
import { concatMap, tap, toArray } from 'rxjs';
import path from 'path';
import { loadAllCommits } from '../load/load-commits';
import { commits } from './commits-query';

describe(`commits`, () => {
    it(`read the commits`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection }) =>
                    commits(connectionString, dbName, commitsCollection),
                ),
                toArray(),
                tap((commits) => {
                    expect(commits).not.undefined;
                    expect(commits.length).equal(3);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);

    it(`read the commits after a certain date`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];
        const after = new Date('2021-08-01');

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection }) =>
                    commits(connectionString, dbName, commitsCollection, after),
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
    }).timeout(20000);
});
