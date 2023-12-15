import { expect } from 'chai';
import { readLinesObs } from 'observable-fs';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { fromCsv } from '@enrico.piccinin/csv-tools';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { mongoFileChurnReportWithProjectInfo, _mongoFileChurnReport } from './mongo-file-churn-report';

describe(`mongoFileChurnReport`, () => {
    it(`generates the report about the churn of files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) => {
                    const outDir = `${process.cwd()}/temp`;
                    return mongoFileChurnReportWithProjectInfo({
                        repoFolderPath,
                        outDir,
                        connectionString,
                        dbName,
                        commitsCollection,
                        filesCollection,
                    });
                }),
                tap((report) => {
                    expect(report.totCommits.val).equal(3);
                    expect(report.firstCommitDate.val.getFullYear()).equal(2019);
                    expect(report.lastCommitDate.val.getFullYear()).equal(2021);
                    // general tests on the files churn report created
                    expect(report).not.undefined;
                    expect(report.params.val.connectionString.includes('mongodb://')).false;
                    expect(report.numFiles.val).equal(3);
                    expect(report.totChurn.val).equal(24);
                    expect(report.clocTot.val).equal(12);
                    expect(report.churn_vs_cloc.val).equal(2);
                    expect(report.topChurnedFiles.val.length).equal(3);
                    // the value for topChurnContributors is 2 since the default value for the parameter of percentage threshold is used
                    expect(report.topChurnContributors.val.length).equal(2);
                    // the top contributors have been created in 2 different years, so there are 2 keys in the dictionary
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(2);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`read the csv file generated together with the report`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const outDir = path.join(process.cwd(), 'temp');
        const csvFileName = path.join(outDir, `${repoName}.csv`);

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) => {
                    return mongoFileChurnReportWithProjectInfo(
                        {
                            repoFolderPath,
                            outDir,
                            connectionString,
                            dbName,
                            commitsCollection,
                            filesCollection,
                        },
                        csvFileName,
                    );
                }),
                concatMap((report) => {
                    return readLinesObs(report.csvFile.val);
                }),
                tap((csvLines) => {
                    // there are 3 lines related to the files plus one line as header
                    expect(csvLines.length).equal(4);
                    // the second line represents the most churned file
                    const mostChurnedFile = fromCsv<any>(csvLines[0], [csvLines[1]])[0];
                    expect(mostChurnedFile.cumulativeChurnPercent).equal(((12 / 24) * 100).toString());
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`_mongoFileChurnReport - test the internals of the report generation logic for specific cases`, () => {
    it(`generates the report about the churn of files with only 1 top churned file`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    _mongoFileChurnReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        filesCollection,
                        topChurnFilesSize: 1,
                        outDir: '',
                    }),
                ),
                tap((report) => {
                    expect(report.topChurnedFiles.val.length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`generates the report about the churn of files with percentage of chunk threshold is set to 20, meaning that it stops counting the files that
    contribute to the churn after the accumulated value is higher than 20%`, (done) => {
        const repoName = 'a-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const percentThreshold = 20;

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    _mongoFileChurnReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        filesCollection,
                        percentThreshold,
                        outDir: '',
                    }),
                ),
                tap((report) => {
                    expect(report.topChurnContributors.val.length).equal(1);
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`generates the report about the churn of files - the 2 top contributors are both from the same year`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, '', 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    _mongoFileChurnReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        filesCollection,
                        outDir: '',
                    }),
                ),
                tap((report) => {
                    expect(report.topChurnContributors.val.length).equal(3);
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
