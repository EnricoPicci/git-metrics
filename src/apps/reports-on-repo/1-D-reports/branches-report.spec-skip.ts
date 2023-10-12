import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { enrichedCommitsStream } from '../1-B-git-enriched-streams/commits';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { BranchesReportParams, projectAndBranchesReport } from './branches-report';
import { commitDaylySummary } from '../1-C-aggregate-in-memory/commit-branch-tips-aggregate';
import { readAll } from '../1-A-read/read-all';
import { commitWithBranchTips } from '../1-B-git-enriched-streams/commits-and-branch-tips';
import { GitLogCommitParams } from '../../../git-functions/git-params';
import { ClocParams } from '../../../cloc-functions/cloc-params';
import { clocSummaryCsvRaw$ } from '../../../cloc-functions/cloc';

describe(`projectAndBranchesReport`, () => {
    it(`generates the report about the branches using this repo as a real repo`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const csvFile = path.join(outDir, 'thisProjectBranchesReport-csv.csv');
        const weeklyCsvFile = path.join(outDir, 'thisProjectWeeklyBranchesReport-csv.csv');
        const filter = ['*.ts'];
        // const after = undefined;

        // read
        const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter, reverse: true };
        const clocParams: ClocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, clocParams);
        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryCsvRaw$(clocSummaryPath);

        const params: BranchesReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };

        // aggregation
        const commitsWithBranchTips = enrichedCommitsStream(commitLogPath, clocLogPath).pipe(commitWithBranchTips());
        const daylySummaryDictionary = commitDaylySummary(commitsWithBranchTips);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);

        projectAndBranchesReport(daylySummaryDictionary, _projectInfo, params, csvFile, weeklyCsvFile)
            .pipe(
                tap((report) => {
                    expect(report.totCommits.val).gt(0);
                    expect(report).not.undefined;
                    expect(report.maxCommits.val).gt(0);
                    expect(report.branchTips.val.length).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(500000);
});
