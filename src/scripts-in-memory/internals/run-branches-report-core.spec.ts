import { expect } from 'chai';
import { tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../git-enriched-streams/commits';
import { runBranchesReport } from './run-branches-report-core';

describe(`runBranchesReport`, () => {
    it(`runs branches report on this project`, (done) => {
        const repoFolderPath = process.cwd();
        // const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        // const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/git`;
        const after = '2017-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFilePrefix = undefined;
        const clocDefsPath = undefined;

        COMMIT_RECORD_COUNTER.count = true;

        const runSingleStream = runBranchesReport(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, false);

        runSingleStream
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});
