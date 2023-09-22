import { expect } from 'chai';
import path from 'path';
import { concatMap, tap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { addAllFilesWithCreationDate } from '../load/load-files';
import { allFiles } from './all-files-query';

describe(`allFiles`, () => {
    it(`calculates the tot number of files and the tot churn from a files collection`, (done) => {
        const repoName = 'a-git-repo';
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
                // then calculate the tot number of files and churn
                concatMap(({ connectionString, dbName, filesCollection }) =>
                    allFiles(connectionString, dbName, filesCollection),
                ),
                tap(({ totNumFiles, totCloc, totLinesAdded, totLinesDeleted }) => {
                    expect(totNumFiles).equal(3);
                    expect(totCloc).equal(11);
                    expect(totLinesAdded).equal(23);
                    expect(totLinesDeleted).equal(5);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
