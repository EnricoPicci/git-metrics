import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { gitCommitStream, enrichedCommitsStream } from '../1-B-git-enriched-streams/commits';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { BranchesReportParams, projectAndBranchesReport } from './branches-report';
import { commitDaylySummary } from '../1-C-aggregate-in-memory/commit-branch-tips-aggregate';
import { commitWithBranchTips } from '../1-B-git-enriched-streams/commits-and-branch-tips';
import { clocSummaryCsvRaw$ } from '../../../cloc-functions/cloc';

describe(`projectAndBranchesReport`, () => {
    it(`generates the report about the branches as well as the general project info`, (done) => {
        const repoName = 'a-project-with-git-branches';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;
        const csvFile = path.join(outDir, 'projectAndBranchesReport-csv.csv');
        const weeklyCsvFile = path.join(outDir, 'thisProjectWeeklyBranchesReport-csv.csv');

        const params: BranchesReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };

        const commitsWithBranchTips = enrichedCommitsStream(commitLogPath, clocLogPath).pipe(commitWithBranchTips());
        const daylySummaryDictionary = commitDaylySummary(commitsWithBranchTips);

        const _commitStream = gitCommitStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryCsvRaw$(repoFolderPath, 'git');
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndBranchesReport(daylySummaryDictionary, _projectInfo, params, csvFile, weeklyCsvFile)
            .pipe(
                tap((report) => {
                    // tests on the general project info held in the report
                    // there are 12 commits, 3 are merges and 9 are the normal commits
                    expect(report.totCommits.val).equal(12);
                    // general tests on the author churn report created
                    expect(report).not.undefined;
                    expect(report.maxCommits.val).equal(4);
                    expect(report.maxMerges.val).equal(1);
                    expect(report.maxBranchTips.val).equal(2);
                    expect(report.branchTips.val.length).equal(1);
                    expect(report.branchTips.val[0]).equal('commit_9');
                    // tests on the data about merges
                    expect(report.totMerges.val).equal(3);
                    expect(report.averageLinesAddDelForMerge.val).equal(54 / 3);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
