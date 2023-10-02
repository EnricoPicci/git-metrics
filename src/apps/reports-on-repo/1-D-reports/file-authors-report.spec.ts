import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { filesStream } from '../1-B-git-enriched-streams/files';
import { commitsStream } from '../1-B-git-enriched-streams/commits';
import { ConfigReadCloc, ConfigReadCommits } from '../1-A-read/read-params/read-params';
import { readAll } from '../1-A-read/read-all';
import { FileAuthorsReportParams, projectAndFileAuthorsReport } from './file-authors-report';
import { clocSummaryInfo } from '../1-A-read/cloc';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { fileAuthors } from '../1-C-aggregate-in-memory/file-authors-aggregate';

describe(`fileAuthorsReportWithProjectInfo`, () => {
    it(`generates the report about the authors of the files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const params: FileAuthorsReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };

        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _fileAuthors = fileAuthors(_filesStream, params.after);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileAuthorsReport(_fileAuthors, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // tests on the general project info held in the report
                    expect(report.totCommits.val).equal(4);
                    // general tests on the author churn report created
                    expect(report).not.undefined;
                    expect(report.fewAutorsFiles.val.length).equal(1);
                    expect(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
                    expect(report.fewAutorsFiles.val[0].commits).equal(1);
                    expect(report.manyAutorsFiles.val.length).equal(1);
                    expect(report.manyAutorsFiles.val[0].path).equal('touched-by-Authors-1-2-3-4.java');
                    expect(report.manyAutorsFiles.val[0].commits).equal(4);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates the report about the author churns - considers only the commits after a certain date`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const after = new Date('2019-01-01');
        const params: FileAuthorsReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _fileAuthors = fileAuthors(_filesStream, params.after);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);

        projectAndFileAuthorsReport(_fileAuthors, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // totCommits contains the number of all commits, not only the commits after the after date
                    expect(report.totCommits.val).equal(4);
                    // general tests on the author churn report created
                    expect(report).not.undefined;
                    expect(report.fewAutorsFiles.val.length).equal(1);
                    expect(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
                    expect(report.fewAutorsFiles.val[0].commits).equal(1);
                    // there is no file with more than 3 authors if we start from 2019, so this value is 0
                    expect(report.manyAutorsFiles.val.length).equal(0);
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
        const after = new Date('2023-09-25');

        // read
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir, vcs: 'git' };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryInfo(clocSummaryPath);

        const params: FileAuthorsReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileAuthors = fileAuthors(_filesStream, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);

        // generation of the report
        projectAndFileAuthorsReport(_fileAuthors, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
                    expect(report.totCommits.val).gt(0);
                    expect(report.clocTot.val).gt(0);
                    expect(report.fewAutorsFiles.val.length).gte(0);
                    expect(report.manyAutorsFiles.val.length).gte(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
