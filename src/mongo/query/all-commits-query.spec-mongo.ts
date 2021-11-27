import { expect } from 'chai';
import path from 'path';
// import path from 'path';
import { concatMap, tap } from 'rxjs';
import { loadAllCommits } from '../load/load-commits';
import { commitsInfo } from './all-commits-query';

describe(`allCommits`, () => {
    it(`calculates the tot number of commits, the first and the last commit`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';

        // first load the commits
        loadAllCommits(commitLogPath, connectionString, repoName, null, 2, clocLogPath)
            .pipe(
                // then calculate the tot number of commits, the first and the last
                concatMap(({ connectionString, dbName, commitsCollection: commitCollection }) =>
                    commitsInfo(connectionString, dbName, commitCollection),
                ),
                tap(({ count, first, last }) => {
                    expect(count).equal(3);
                    expect(first.committerDate.getFullYear()).equal(2019);
                    expect(last.committerDate.getFullYear()).equal(2021);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
