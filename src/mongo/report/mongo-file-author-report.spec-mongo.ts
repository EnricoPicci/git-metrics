import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { mongoFileAuthorReportWithProjectInfo } from './mongo-file-author-report';

describe(`mongoFileAuthorReport`, () => {
    it(`generates the report about the authors of the files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // then augment the files with their creation date
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    addAllFilesWithCreationDate(connectionString, dbName, commitCollection),
                ),
                // then generate the report
                concatMap(({ connectionString, dbName, filesCollection, commitsCollection }) => {
                    const outDir = `${process.cwd()}/temp`;
                    return mongoFileAuthorReportWithProjectInfo({
                        repoFolderPath,
                        outDir,
                        connectionString,
                        dbName,
                        commitsCollection,
                        filesCollection,
                    });
                }),
                tap((report) => {
                    // tests on the general project info held in the report
                    expect(report.totCommits.val).equal(4);
                    // general tests on the author churn report created
                    expect(report).not.undefined;
                    expect(report.fewAutorsFiles.val.length).equal(1);
                    expect(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
                    expect(report.fewAutorsFiles.val[0].commits).equal(1);
                    expect(report.manyAutorsFiles.val.length).equal(1);
                    expect(report.manyAutorsFiles.val[0].path).equal('touched-by-Authors-1-2-3-4.java');
                    expect(report.manyAutorsFiles.val[0].commits).equal(4);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
