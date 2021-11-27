import { expect } from 'chai';
import path from 'path';

import { tap } from 'rxjs/operators';
import { fileCoupling } from '../aggregate-in-memory/file-coupling-aggregate';
import { projectInfo } from '../aggregate-in-memory/project-info-aggregate';
import { clocSummaryInfo, clocSummaryStream } from '../git-read-enrich/cloc';
import { enrichedCommitsStream } from '../git-read-enrich/commits';
import { ConfigReadCloc, ConfigReadCommits } from '../git-read-enrich/config/config';
import { readAll } from '../git-read-enrich/read-all';

import {
    fileCouplingReportCore,
    FilesCouplingReportParams,
    projectAndFileCouplingReport,
} from './file-coupling-report';

describe(`fileCouplingReport`, () => {
    it(`generates the report about the churn of files and checks that the filesCouplingInfo has been filled`, (done) => {
        const repoName = 'io-backend';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const depthInFilesCoupling = 10;

        const commits = enrichedCommitsStream(commitLogPath, clocLogPath);
        const fileCouplingStream = fileCoupling(commits, depthInFilesCoupling);
        const outDir = `${process.cwd()}/temp`;
        const params: FilesCouplingReportParams = {
            outDir,
        };

        fileCouplingReportCore(fileCouplingStream, params)
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report.maxCouplings.val.length).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`fileCouplingReportWithProjectInfo`, () => {
    it(`generates the report about file couplings and checks that the filesCouplingInfo has been filled with something`, (done) => {
        const repoName = 'a-git-repo';
        const outDir = `${process.cwd()}/temp`;
        const after = undefined;
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const depthInFilesCoupling = 10;

        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const params: FilesCouplingReportParams = {
            repoFolderPath,
            outDir,
            after,
        };

        // aggregation
        const _fileCoupling = fileCoupling(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileCouplingReport(_fileCoupling, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report.maxCouplings.val.length).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about file couplings but considers only commits in the future. Since git log can not find commits in the future,
    then filesCouplingInfo should be empty`, (done) => {
        const repoName = 'a-git-repo';
        const outDir = `${process.cwd()}/temp`;
        const after = new Date();
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const depthInFilesCoupling = 10;

        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const params: FilesCouplingReportParams = {
            repoFolderPath,
            outDir,
            after,
        };

        // aggregation
        const _fileCoupling = fileCoupling(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileCouplingReport(_fileCoupling, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report.maxCouplings.val.length).equal(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`read - source stream generation - aggregation - generation of the report about this project`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const filter = ['*.ts'];
        const after = undefined;
        const depthInFilesCoupling = 10;

        // read
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

        // generation of the source streams
        const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryStream(clocSummaryPath);

        const params: FilesCouplingReportParams = {
            repoFolderPath,
            outDir,
            after,
        };

        // aggregation
        const _fileCoupling = fileCoupling(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);

        projectAndFileCouplingReport(_fileCoupling, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    expect(report.maxCouplings.val.length).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
