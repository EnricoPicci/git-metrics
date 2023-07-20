import { expect } from 'chai';
import path from 'path';
import { tap, concatMap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { MongoReportParams } from './mongo-report';

describe(`projectInfo`, () => {
    it(`calculates the general project info`, (done) => {
        const repoName = 'a-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        const params = {
            repoFolderPath,
            outDir: `${process.cwd()}/temp`,
            connectionString,
        } as MongoReportParams;

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // once the commits have been loaded we can calculate the project info
                concatMap(({ commitsCollection }) => {
                    return mongoProjectInfo({ ...params, commitsCollection });
                }),
                tap((prjInfo) => {
                    expect(prjInfo.commits.count).equal(3);
                    expect(prjInfo.commits.first.committerDate.getFullYear()).equal(2019);
                    expect(prjInfo.commits.last.committerDate.getFullYear()).equal(2021);
                    expect(prjInfo.clocSummaryInfo.length).equal(4);
                    const containsOneLineForJava =
                        prjInfo.clocSummaryInfo.filter((l) => l.includes('Java')).length === 1;
                    expect(containsOneLineForJava).true;
                    const containsOneLineForPython =
                        prjInfo.clocSummaryInfo.filter((l) => l.includes('Python')).length === 1;
                    expect(containsOneLineForPython).true;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
