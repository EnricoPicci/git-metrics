import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { _mongoModuleChurnReport } from './mongo-module-churn-report';

describe(`_mongoFileChurnReport - test the internals of the report generation logic sing a real workd repo log`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `the repo folder path is not used for this test`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const numberOfTopChurnModules = 3;

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    _mongoModuleChurnReport({
                        repoFolderPath,
                        connectionString,
                        dbName,
                        filesCollection,
                        outDir: `${process.cwd()}/temp`,
                        numberOfTopChurnModules,
                    }),
                ),
                tap((report) => {
                    expect(report.numModules.val).equal(8);
                    //
                    expect(report.topChurnedModules.val.length).equal(numberOfTopChurnModules);
                    // the first module in terms of churn is the root since it holds all other modules
                    expect(report.topChurnedModules.val[0].path).equal('.');
                    // the max number of folders in any module is 4 for "./src/services/__tests__" or "./src/controllers/__tests__"
                    expect(report.maxModuleDepth.val).equal(4);
                    //
                    const clocExpected = 2249;
                    const churnExpected = 485;
                    expect(report.clocTot.val).equal(clocExpected);
                    expect(report.totChurn.val).equal(churnExpected);
                    expect(report.churn_vs_cloc.val).equal(churnExpected / clocExpected);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
