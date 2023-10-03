import { expect } from 'chai';
import { readLinesObs } from 'observable-fs';
import path from 'path';
import { tap, concatMap } from 'rxjs';
import { fromCsv } from '../../../tools/csv/from-csv';
import { filesStream } from '../1-B-git-enriched-streams/files';
import { commitsStream } from '../1-B-git-enriched-streams/commits';
import { ConfigReadCloc } from '../1-A-read/read-params/read-params';
import { readAll } from '../1-A-read/read-all';
import { fileChurnReportCore, FileChurnReportParams, projectAndFileChurnReport } from './file-churn-report';
import { clocSummaryInfo } from '../1-A-read/cloc';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { fileChurn } from '../1-C-aggregate-in-memory/file-churn-aggregate';
import { GitLogCommitParams } from '../../../git-functions/git-params';

describe(`fileChurnReportCore`, () => {
    it(`generates the report about the churn of files`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);
        const outDir = `${process.cwd()}/temp`;
        const params: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };

        fileChurnReportCore(fileChurns, params)
            .pipe(
                tap((report) => {
                    // general tests on the files churn report created
                    expect(report).not.undefined;
                    expect(report.numFiles.val).equal(3);
                    expect(report.totChurn.val).equal(24);
                    expect(report.clocTot.val).equal(12);
                    expect(report.churn_vs_cloc.val).equal(2);
                    expect(report.topChurnedFiles.val.length).equal(3);
                    // the value for topChurnContributors is 2 since the default value for the parameter of percentage threshold is used
                    expect(report.topChurnContributors.val.length).equal(2);
                    // the top contributors have been created in 2 different years, so there are 2 keys in the dictionary
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(2);
                    //
                    const mostChurnedFile = report.topChurnedFiles.val[0];
                    expect(mostChurnedFile.path).equal('hallo-lazy.java');
                    expect(mostChurnedFile.created.getFullYear()).equal(2020);
                    expect(mostChurnedFile.created.getMonth()).equal(8);
                    expect(mostChurnedFile.created.getDate()).equal(22);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates the report about the churn of files - unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);
        const outDir = `${process.cwd()}/temp`;
        const params: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };

        fileChurnReportCore(fileChurns, params)
            .pipe(
                tap((report) => {
                    // general tests on the files churn report created
                    expect(report).not.undefined;
                    expect(report.numFiles.val).equal(0);
                    expect(report.totChurn.val).equal(0);
                    expect(report.clocTot.val).equal(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`fileChurnReportCore - test the internals of the report generation logic for specific cases`, () => {
    it(`generates the report about the churn of files with only 1 top churned file`, (done) => {
        const repoName = 'a-git-repo-with-one-star-author';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = './temp';
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        const params: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
            topChurnFilesSize: 1,
        };

        fileChurnReportCore(fileChurns, params)
            .pipe(
                tap((report) => {
                    expect(report.topChurnedFiles.val.length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`generates the report about the churn of files with percentage of chunk threshold is set to 20, meaning that it stops counting the files that
    contribute to the churn after the accumulated value is higher than 20%`, (done) => {
        const repoName = 'a-git-repo-py';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const percentThreshold = 20;

        const outDir = './temp';
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        const params: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
            percentThreshold,
        };

        fileChurnReportCore(fileChurns, params)
            .pipe(
                tap((report) => {
                    expect(report.topChurnContributors.val.length).equal(1);
                    const topChurnContributor = report.topChurnContributors.val[0];
                    expect(topChurnContributor.path).equal(`good-by.py`);
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`generates the report about the churn of files - the 2 top contributors are both from the same year`, (done) => {
        const repoName = 'a-git-repo-uneven-author-churn';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = './temp';
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        const params: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };

        fileChurnReportCore(fileChurns, params)
            .pipe(
                tap((report) => {
                    expect(report.topChurnContributors.val.length).equal(3);
                    expect(Object.keys(report.topChurnContributorsAge.val).length).equal(1);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`projectAndFileChurnReport`, () => {
    it(`generates the report about the churn of files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-with-one-lazy-author';
        const outDir = `${process.cwd()}/temp`;
        const after = undefined;

        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        // generation of the source streams
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const params: FileChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileChurn = fileChurn(_filesStream, true, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileChurnReport(_fileChurn, _projectInfo, params)
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
    it(`read the csv file generated together with the report`, (done) => {
        const repoFolderPath = 'a-git-repo-with-one-lazy-author';
        const outDir = path.join(process.cwd(), 'temp');
        const after = undefined;

        const csvFile = path.join(process.cwd(), 'temp', `${repoFolderPath}.csv`);

        const testDataPath = path.join(process.cwd(), 'test-data', 'output');
        const [commitLogPath, clocLogPath, clocSummaryPath] = [
            path.join(testDataPath, `${repoFolderPath}-commits.gitlog`),
            path.join(testDataPath, `${repoFolderPath}-cloc.gitlog`),
            path.join(testDataPath, `${repoFolderPath}-summary-cloc.csv`),
        ];
        // generation of the source streams
        const _clocSummaryInfo = clocSummaryInfo(clocSummaryPath);
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);

        const params: FileChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileChurn = fileChurn(_filesStream, true, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileChurnReport(_fileChurn, _projectInfo, params, csvFile)
            .pipe(
                concatMap((report) => {
                    return readLinesObs(report.csvFile.val);
                }),
                tap((csvLines) => {
                    // there are 3 lines related to the files plus one line as header
                    expect(csvLines.length).equal(4);
                    // the first object represents the most churned file
                    const mostChurnedFile = fromCsv(csvLines[0], [csvLines[1]])[0];
                    expect(mostChurnedFile.cumulativeChurnPercent).equal(`${(12 / 24) * 100}`);
                    expect(mostChurnedFile.cumulativeNumberOfFilesPercent).equal(`${(1 / 3) * 100}`);
                    expect(mostChurnedFile.churnRanking).equal(`1`);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates the report about the churn of files - considers only the commits after a certain date`, (done) => {
        // input from the user
        const repoFolderPath = 'a-git-repo-with-one-lazy-author';
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2021-01-01');

        const testDataPath = path.join(process.cwd(), 'test-data', 'output');
        const [commitLogPath, clocLogPath, clocSummaryPath] = [
            path.join(testDataPath, `${repoFolderPath}-commits.gitlog`),
            path.join(testDataPath, `${repoFolderPath}-cloc.gitlog`),
            path.join(testDataPath, `${repoFolderPath}-summary-cloc.csv`),
        ];
        // generation of the source streams
        const _clocSummaryInfo = clocSummaryInfo(clocSummaryPath);
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);

        const params: FileChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileChurn = fileChurn(_filesStream, true, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileChurnReport(_fileChurn, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // totCommits contains the number of all commits, not only the commits after the after date
                    expect(report.totCommits.val).equal(3);
                    expect(report.totChurn.val).equal(11);
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
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir, vcs: 'git' };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryInfo(clocSummaryPath);

        const params: FileChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileChurn = fileChurn(_filesStream, true, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);

        projectAndFileChurnReport(_fileChurn, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
                    expect(report.totCommits.val).gt(0);
                    expect(report.clocTot.val).gt(0);
                    expect(report.churn_vs_cloc.val).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
