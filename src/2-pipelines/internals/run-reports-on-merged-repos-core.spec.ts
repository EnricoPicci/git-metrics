import { tap } from 'rxjs';
import { COMMIT_RECORD_COUNTER } from '../../1-B-git-enriched-streams/commits';
import { AuthorChurnReport } from '../../1-D-reports/author-churn-report';
import { FileChurnReport } from '../../1-D-reports/file-churn-report';
import { ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import { runAllReportsOnMergedRepos } from './run-reports-on-merged-repos-core';
import path from 'path';
import { expect } from 'chai';

describe(`runAllReportsOnMergedRepos`, () => {
    it(`runs all the reports after merging all the repo gitlogs for the repos present in the src folder.
    Considering that this folder does not contain any directory with a repo, the merge will merge no repos.`, (done) => {
        const reports = [AuthorChurnReport.name, FileChurnReport.name, ModuleChurnReport.name];
        const repoFolderPath = path.join(process.cwd(), 'src');
        const filter = ['*.ts'];
        const after = '2021-10-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const ignoreClocZero = true;
        const depthInFilesCoupling = 10;

        COMMIT_RECORD_COUNTER.count = true;
        COMMIT_RECORD_COUNTER.numberOfCommitLines = 0;

        const runSingleStream = runAllReportsOnMergedRepos(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFile,
            clocDefsPath,
            ignoreClocZero,
            depthInFilesCoupling,
            false, // single stream mode
            false,
        );

        runSingleStream
            .pipe(
                tap((report) => {
                    // expect report to be defined
                    expect(report).to.not.be.undefined;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});
