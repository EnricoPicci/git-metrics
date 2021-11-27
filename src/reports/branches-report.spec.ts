import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { commitsStream, enrichedCommitsStream } from '../git-read-enrich/commits';
import { clocSummaryInfo, clocSummaryStream } from '../git-read-enrich/cloc';
import { projectInfo } from '../aggregate-in-memory/project-info-aggregate';
import { BranchesReportParams, projectAndBranchesReport } from './branches-report';
import { commitDaylySummary } from '../aggregate-in-memory/commit-branch-tips-aggregate';
import { ConfigReadCloc, ConfigReadCommits } from '../git-read-enrich/config/config';
import { readAll } from '../git-read-enrich/read-all';

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

        const commits = enrichedCommitsStream(commitLogPath, clocLogPath);
        const daylySummaryDictionary = commits.pipe(commitDaylySummary());

        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);
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
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about the branches using a this repo as a real repo`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        // const repoFolderPath = `~/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/io-app`;
        const outDir = `${process.cwd()}/temp`;
        const csvFile = path.join(outDir, 'thisProjectBranchesReport-csv.csv');
        const weeklyCsvFile = path.join(outDir, 'thisProjectWeeklyBranchesReport-csv.csv');
        const filter = ['*.ts'];
        // const after = undefined;

        // read
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryStream(clocSummaryPath);

        const params: BranchesReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };

        // aggregation
        const daylySummaryDictionary = _commitStream.pipe(commitDaylySummary());
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
    }).timeout(20000);
});
