import { expect } from 'chai';
import { concatMap, tap, toArray } from 'rxjs';
import path from 'path';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { authorChurn } from './author-churn-query';

describe(`authorChurn`, () => {
    it(`query commits and files collections to calculate the churn info for author`, (done) => {
        const logName = 'git-repo-5-author-churn';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params: [string, string, string] = [logFilePath, connectionString, logName];

        // first load the commits
        loadAllCommits(...params)
            .pipe(
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) =>
                    // then query for the author churns
                    authorChurn(connectionString, dbName, filesCollection, commitsCollection),
                ),
                toArray(),
                tap((authors) => {
                    expect(authors.length).equal(2);
                    const a1 = authors.find((a) => a.authorName === 'Picci-1');
                    expect(a1.linesAdded).equal(12);
                    expect(a1.linesDeleted).equal(5);
                    expect(a1.linesAddDel).equal(17);
                    expect(a1.commits).equal(2);
                    expect(a1.firstCommit.getFullYear()).equal(2019);
                    expect(a1.lastCommit.getFullYear()).equal(2021);
                    const a2 = authors.find((a) => a.authorName === 'Picci-2');
                    expect(a2.linesAdded).equal(3);
                    expect(a2.linesDeleted).equal(1);
                    expect(a2.linesAddDel).equal(4);
                    expect(a2.commits).equal(1);
                    expect(a2.firstCommit.getFullYear()).equal(2020);
                    expect(a2.lastCommit.getFullYear()).equal(2020);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`query commits and files collections to calculate the churn info for author after a certain date`, (done) => {
        const logName = 'git-repo-5-author-churn';
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
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) =>
                    // then query for the author churns
                    authorChurn(connectionString, dbName, filesCollection, commitsCollection, after),
                ),
                toArray(),
                tap((authors) => {
                    expect(authors.length).equal(2);
                    const a1 = authors.find((a) => a.authorName === 'Picci-1');
                    expect(a1.linesAdded).equal(9);
                    expect(a1.linesDeleted).equal(5);
                    expect(a1.linesAddDel).equal(14);
                    expect(a1.commits).equal(1);
                    expect(a1.firstCommit.getFullYear()).equal(2021);
                    expect(a1.lastCommit.getFullYear()).equal(2021);
                    const a2 = authors.find((a) => a.authorName === 'Picci-2');
                    expect(a2.linesAdded).equal(3);
                    expect(a2.linesDeleted).equal(1);
                    expect(a2.linesAddDel).equal(4);
                    expect(a2.commits).equal(1);
                    expect(a2.firstCommit.getFullYear()).equal(2020);
                    expect(a2.lastCommit.getFullYear()).equal(2020);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`calculate the churn info for author from a real world repo`, (done) => {
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
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) =>
                    // then query for the author churns
                    authorChurn(connectionString, dbName, filesCollection, commitsCollection),
                ),
                toArray(),
                tap((authors) => {
                    expect(authors.length).equal(27);
                    const a1 = authors.find((a) => a.authorName === 'Danilo Spinelli');
                    expect(a1).not.undefined;
                    expect(a1.linesAddDel).gt(0);
                    expect(a1.commits).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
