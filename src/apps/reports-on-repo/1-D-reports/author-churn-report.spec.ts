import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { authorChurn } from '../1-C-aggregate-in-memory/author-churn-aggregate';
import { commitsStream, enrichedCommitsStream } from '../1-B-git-enriched-streams/commits';
import { readAll } from '../1-A-read/read-all';
import { authorChurnReportCore, AuthorChurnReportParams, projectAndAuthorChurnReport } from './author-churn-report';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { GitLogCommitParams } from '../../../git-functions/git-params';
import { ClocParams } from '../../../cloc-functions/cloc-params';
import { clocSummaryCsvRaw$ } from '../../../cloc-functions/cloc.functions';

describe(`authorChurnReport`, () => {
    it(`generates the report about the churn generated by the authors`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);

        const commits = commitsStream(commitLogPath);

        const fileChurnStream = authorChurn(commits);
        const outDir = './temp';
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };

        authorChurnReportCore(fileChurnStream, params, '')
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report!.numAuthors.val).equal(3);
                    expect(report!.totChurn.val).equal(155);
                    expect(report!.topAuthors.val.length).equal(3);
                    expect(report!.topAuthorChurnContributors.val.length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates the report about the  churn generated by the authors - 
        unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const commitLogPath = path.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);

        const commits = commitsStream(commitLogPath);

        const fileChurnStream = authorChurn(commits);
        const outDir = './temp';
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };

        authorChurnReportCore(fileChurnStream, params, '')
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report.numAuthors.val).equal(0);
                    expect(report.totChurn.val).equal(0);
                    expect(report.topAuthors.val.length).equal(0);
                    expect(report.topAuthorChurnContributors.val.length).equal(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`authorChurnReport - test some special cases`, () => {
    it(`generates the report about the churn generated by authors with only 1 top author`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);

        const commits = commitsStream(commitLogPath);

        const fileChurnStream = authorChurn(commits);
        const outDir = './temp';
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnAuthors: 1,
        };

        authorChurnReportCore(fileChurnStream, params, '')
            .pipe(
                tap((report) => {
                    expect(report.topAuthors.val.length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`generates the report about the churn generated by authors with percentage of chunk threshold is set to 95,
    meaning that it stops counting the files that contribute to the churn after the accumulated value is higher than 95%
    In this case the top  contributors required to reach the threshold are 2 considering the distribution of churn in tha input commits log file`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);

        const commits = commitsStream(commitLogPath);

        const fileChurnStream = authorChurn(commits);
        const outDir = './temp';
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
            percentThreshold: 95,
        };

        authorChurnReportCore(fileChurnStream, params, '')
            .pipe(
                tap((report) => {
                    expect(report.topAuthorChurnContributors.val.length).equal(2);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`authorChurnReportWithProjectInfo`, () => {
    it(`generates the report about the author churns as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const params: AuthorChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };

        const _commitStream = commitsStream(commitLogPath);
        const _authorChurn = authorChurn(_commitStream, params.after);
        const _clocSummaryInfo = clocSummaryCsvRaw$(repoFolderPath, 'git');
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndAuthorChurnReport(_authorChurn, _projectInfo, params, '')
            .pipe(
                tap((report) => {
                    expect(report.totCommits.val).equal(3);
                    expect(report.firstCommitDate.val.getFullYear()).equal(2019);
                    expect(report.lastCommitDate.val.getFullYear()).equal(2021);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates the report about authors churns - considers only the commits after a certain date`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const after = new Date('2021-01-01');
        const params: AuthorChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        const _commitStream = commitsStream(commitLogPath);
        const _authorChurn = authorChurn(_commitStream, params.after);
        const _clocSummaryInfo = clocSummaryCsvRaw$(repoFolderPath, 'git');
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndAuthorChurnReport(_authorChurn, _projectInfo, params, '')
            .pipe(
                tap((report) => {
                    // totCommits contains the number of all commits, not only the commits after the after date
                    expect(report.totCommits.val).equal(3);
                    expect(report.totChurn.val).equal(132);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`read - source stream generation - aggregation - generation of the report about this project`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const filter = ['*.ts'];
        const after = undefined;

        // read
        const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter, reverse: true };
        const clocParams: ClocParams = { folderPath: repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, clocParams);
        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryCsvRaw$(clocSummaryPath);

        const params: AuthorChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _authorChurn = authorChurn(_commitStream, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);

        projectAndAuthorChurnReport(_authorChurn, _projectInfo, params, '')
            .pipe(
                tap((report) => {
                    // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
                    expect(report.totCommits.val).gt(0);
                    expect(report.totChurn.val).gt(0);
                    expect(report.numAuthors.val).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
