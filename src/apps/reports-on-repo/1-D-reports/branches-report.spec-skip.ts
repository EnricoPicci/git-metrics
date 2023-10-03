import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { enrichedCommitsStream } from '../1-B-git-enriched-streams/commits';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { BranchesReportParams, projectAndBranchesReport } from './branches-report';
import { commitDaylySummary } from '../1-C-aggregate-in-memory/commit-branch-tips-aggregate';
import { ConfigReadCloc } from '../1-A-read/read-params/read-params';
import { readAll } from '../1-A-read/read-all';
import { commitWithBranchTips } from '../1-B-git-enriched-streams/commits-and-branch-tips';
import { clocSummaryInfo } from '../1-A-read/cloc';
import { GitLogCommitParams } from '../../../git-functions/git-params';

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
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryInfo(clocSummaryPath);

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
