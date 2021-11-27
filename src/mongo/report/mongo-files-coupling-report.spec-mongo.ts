import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { _mongoFilesCouplingReport } from './mongo-files-coupling-report';

describe(`_mongoFilesCouplingReport - test the internals of the report generation logic using a real workd repo log`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'io-backend';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // then generate the report
                concatMap(({ connectionString, dbName, commitsCollection }) =>
                    _mongoFilesCouplingReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        commitsCollection,
                        outDir: `${process.cwd()}/temp`,
                    }),
                ),
                tap((report) => {
                    expect(report).not.undefined;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about the churn of files setting a low depth for the report`, (done) => {
        const repoName = 'io-backend';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const depthInFilesCoupling = 10;

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // then generate the report
                concatMap(({ connectionString, dbName, commitsCollection }) =>
                    _mongoFilesCouplingReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        commitsCollection,
                        outDir: `${process.cwd()}/temp`,
                        depthInFilesCoupling,
                    }),
                ),
                tap((report) => {
                    expect(report).not.undefined;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
