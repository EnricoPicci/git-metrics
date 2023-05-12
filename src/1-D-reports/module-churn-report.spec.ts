import { expect } from 'chai';
import path from 'path';
import { tap, share, concatMap } from 'rxjs';
import { filesStream } from '../1-B-git-enriched-streams/files';
import { commitsStream } from '../1-B-git-enriched-streams/commits';
import { ModuleChurnReportParams, projectAndModuleChurnReport } from './module-churn-report';
import { clocSummaryInfo, clocSummaryStream } from '../1-A-read/cloc';
import { projectInfo } from '../1-C-aggregate-in-memory/project-info-aggregate';
import { fileChurn } from '../1-C-aggregate-in-memory/file-churn-aggregate';
import { moduleChurns } from '../1-C-aggregate-in-memory/module-churn-aggregate';
import { readLinesObs } from 'observable-fs';
import { fromCsv } from '../0-tools/csv/from-csv';
import { ConfigReadCloc, ConfigReadCommits } from '../1-A-read/read-params/read-params';
import { readAll } from '../1-A-read/read-all';

describe(`projectAndModuleChurnReport`, () => {
    it(`generates the report about the churn of modules`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const fileChurns = fileChurn(fileCommits, true).pipe(share());
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = moduleChurns(fileChurns);

        const numberOfTopChurnModules = 3;
        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report.numModules.val).equal(8);
                    //
                    expect(report.topChurnedModules.val.length).equal(numberOfTopChurnModules);
                    // the first module in terms of churn is the root since it holds all other modules
                    expect(report.topChurnedModules.val[0].path).equal('.');
                    // the max number of folders in any module is 4 for "./src/services/__tests__" or "./src/controllers/__tests__"
                    expect(report.maxModuleDepth.val).equal(4);
                    //
                    const clocExpected = 2249;
                    const churnExpected = 485;
                    expect(report.clocTot.val).equal(clocExpected);
                    expect(report.totChurn.val).equal(churnExpected);
                    expect(report.churn_vs_cloc.val).equal(churnExpected / clocExpected);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about the churn of modules in case of a repo with files in root and in a folder`, (done) => {
        const repoName = 'a-git-repo-with-files-in-root-and-folder';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const fileChurns = fileChurn(fileCommits, true).pipe(share());
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = moduleChurns(fileChurns);

        const numberOfTopChurnModules = 3;
        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report.numModules.val).equal(2);
                    //
                    expect(report.topChurnedModules.val.length).equal(2);
                    // the first module in terms of churn is the root (./) since it holds all other modules
                    expect(report.topChurnedModules.val[0].path).equal('.');
                    // the max number of folders is 2 for "./java"
                    expect(report.maxModuleDepth.val).equal(2);
                    //
                    const clocExpected = 11;
                    const churnExpected = 28;
                    expect(report.clocTot.val).equal(clocExpected);
                    expect(report.totChurn.val).equal(churnExpected);
                    expect(report.churn_vs_cloc.val).equal(churnExpected / clocExpected);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`read the csv file generated together with the report`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const fileChurns = fileChurn(fileCommits, true).pipe(share());
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = moduleChurns(fileChurns);

        const numberOfTopChurnModules = 3;
        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };

        const csvFile = path.join(outDir, repoName);

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params, csvFile)
            .pipe(
                concatMap((report) => {
                    return readLinesObs(report.csvFile.val);
                }),
                tap((csvLines) => {
                    // there are 8 lines related to the modules plus one line as header
                    expect(csvLines.length).equal(9);
                    //
                    const churnedModules = fromCsv(csvLines[0], csvLines.slice(1));
                    // the first object represents the most churned module
                    const mostChurnedModule = churnedModules[0];
                    expect(mostChurnedModule.level_0).equal('.');
                    expect(mostChurnedModule.level_1).equal('');
                    expect(mostChurnedModule.level_2).equal('');
                    expect(mostChurnedModule.level_3).equal('');
                    // the last object represents the least churned module
                    const leastChurnedModule = churnedModules[churnedModules.length - 1];
                    expect(leastChurnedModule.level_0).equal('.');
                    expect(leastChurnedModule.level_1).equal('src');
                    expect(leastChurnedModule.level_2).equal('services');
                    expect(leastChurnedModule.level_3).equal('__tests__');
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about the churn of modules - considers only commits after a certain date`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const after = new Date('2021-09-01');

        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const fileChurns = fileChurn(fileCommits, true, after).pipe(share());
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = moduleChurns(fileChurns);

        const numberOfTopChurnModules = 10;
        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
            numberOfTopChurnModules,
        };

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report).not.undefined;
                    const modules = report.topChurnedModules.val;
                    expect(Object.values(modules).filter((m) => m.linesAddDel > 0).length).equal(4);
                    //
                    const srcServices = modules.find((m) => m.path === './src/services');
                    expect(srcServices.numChurnedFiles).equal(3);
                    expect(srcServices.linesAdded).equal(2);
                    expect(srcServices.linesDeleted).equal(1);
                    expect(srcServices.linesAddDel).equal(3);
                    //
                    const srcServicesTests = modules.find((m) => m.path === './src/services/__tests__');
                    expect(srcServicesTests.numChurnedFiles).equal(2);
                    expect(srcServicesTests.linesAdded).equal(2);
                    expect(srcServicesTests.linesDeleted).equal(1);
                    expect(srcServicesTests.linesAddDel).equal(3);
                    //
                    expect(report.numModules.val).equal(8);
                    expect(report.numChangedModules.val).equal(4);
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

        // read
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = commitsStream(commitLogPath);
        const _filesStream = filesStream(commitLogPath, clocLogPath);
        const _clocSummaryStream = clocSummaryStream(clocSummaryPath);

        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };

        // aggregation
        const _fileChurn = fileChurn(_filesStream, true, params.after);
        const _projectInfo = projectInfo(_commitStream, _clocSummaryStream);
        const moduleChurnsStream = moduleChurns(_fileChurn);

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params)
            .pipe(
                tap((report) => {
                    // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
                    expect(report).not.undefined;
                    const modules = report.topChurnedModules.val;
                    expect(modules).not.undefined;
                    expect(Object.keys(modules).length).gt(0);
                    //
                    const srcModule = modules.find((m) => m.path === './src');
                    expect(srcModule).not.undefined;
                    expect(srcModule.numChurnedFiles).gt(0);
                    expect(srcModule.linesAdded).gt(0);
                    expect(srcModule.linesDeleted).gt(0);
                    expect(srcModule.linesAddDel).equal(srcModule.linesAdded + srcModule.linesDeleted);

                    expect(report.numModules.val).gt(0);
                    expect(report.topChurnedModules.val.length).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates the report about the churn of modules - 
    unfortunately there are no files (e.g. because the filter is too restrictive)`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path.join(process.cwd(), `/test-data/output/empty-gitlog.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const outDir = `${process.cwd()}/temp`;

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const _commitStream = commitsStream(commitLogPath);
        const _clocSummaryInfo = clocSummaryInfo(repoFolderPath, outDir);

        const fileChurns = fileChurn(fileCommits, true).pipe(share());
        const _projectInfo = projectInfo(_commitStream, _clocSummaryInfo);
        const moduleChurnsStream = moduleChurns(fileChurns);

        const numberOfTopChurnModules = 3;
        const params: ModuleChurnReportParams = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            numberOfTopChurnModules,
        };

        projectAndModuleChurnReport(moduleChurnsStream, _projectInfo, params)
            .pipe(
                tap((report) => {
                    expect(report.numModules.val).equal(0);
                    //
                    expect(report.topChurnedModules.val.length).equal(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
