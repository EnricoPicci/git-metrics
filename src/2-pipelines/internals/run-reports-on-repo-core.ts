import path from 'path';
import { forkJoin, Observable } from 'rxjs';
import { concatMap, filter, map, share } from 'rxjs/operators';

import { ConfigReadCommits, ConfigReadCloc } from '../../1-A-read/read-params/read-params';
import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';
import { clocSummaryStream } from '../../1-A-read/cloc';

import { enrichedCommitsStream } from '../../1-B-git-enriched-streams/commits';
import { filesStream, filesStreamFromEnrichedCommitsStream } from '../../1-B-git-enriched-streams/files';
import { FileGitCommitEnriched, GitCommitEnriched } from '../../1-B-git-enriched-types/git-types';

import { projectInfo } from '../../1-C-aggregate-in-memory/project-info-aggregate';
import { ProjectInfo } from '../../1-C-aggregate-types/project-info';

import { FileChurnReport } from '../../1-D-reports/file-churn-report';
import { AuthorChurnReport } from '../../1-D-reports/author-churn-report';
import { FileAuthorsReport } from '../../1-D-reports/file-authors-report';
import { FilesCouplingReport } from '../../1-D-reports/file-coupling-report';
import { ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import { Report, ReportParams } from '../../1-D-reports/report';

import {
    fileChurnReportGenerator,
    moduleChurnReportGenerator,
    authorChurnReportGenerator,
    fileAuthorsReportGenerator,
    fileCouplingReportGenerator,
} from './report-generators';

export const allReports = [
    FileChurnReport.name,
    ModuleChurnReport.name,
    AuthorChurnReport.name,
    FileAuthorsReport.name,
    FilesCouplingReport.name,
];
export function runReports(
    reports: string[],
    repoFolderPath: string,
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    parallelReadOfCommits: boolean,
    noRenames: boolean,
    depthInFilesCoupling?: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // read the data from git and cloc tool
    const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

    // generation of the source streams
    const { _commitStream, _filesStream, _clocSummaryStream } = _streams(
        commitLogPath,
        clocLogPath,
        clocSummaryPath,
        parallelReadOfCommits,
        after,
        before,
    );

    // run the reports
    return runReportsFromStreams(
        reports,
        repoFolderPath,
        filter,
        after,
        before,
        outDir,
        outFilePrefix,
        clocDefsPath,
        depthInFilesCoupling,
        _commitStream,
        _filesStream,
        _clocSummaryStream,
    );
}

export function _streams(
    commitLogPath: string,
    clocLogPath: string,
    clocSummaryPath: string,
    parallelRead: boolean,
    after: string,
    before: string,
) {
    const _after = new Date(after);
    const _before = new Date(before);
    const _enrichedCommitsStream = enrichedCommitsStream(commitLogPath, clocLogPath);
    const _commitStream = parallelRead ? _enrichedCommitsStream : _enrichedCommitsStream.pipe(share());
    const _filesStream = parallelRead
        ? filesStream(commitLogPath, clocLogPath).pipe(
              filter((file) => {
                  const commitDate = new Date(file.committerDate);
                  const isAfter = after ? commitDate > _after : true;
                  const isBefore = before ? commitDate < _before : true;
                  return isAfter && isBefore;
              }),
          )
        : filesStreamFromEnrichedCommitsStream(_commitStream).pipe(
              filter((file) => {
                  const commitDate = new Date(file.committerDate);
                  const isAfter = after ? commitDate > _after : true;
                  const isBefore = before ? commitDate < _before : true;
                  return isAfter && isBefore;
              }),
              share(),
          );
    const _clocSummaryStream = clocSummaryStream(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}

export function runReportsFromStreams(
    reports: string[],
    repoFolderPath: string,
    _filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    depthInFilesCoupling: number,
    _commitStream: Observable<GitCommitEnriched>,
    _filesStream: Observable<FileGitCommitEnriched>,
    _clocSummaryStream: Observable<string[]>,
) {
    const params: ReportParams = {
        repoFolderPath,
        outDir,
        filter: _filter,
        clocDefsPath,
        after: new Date(after),
        before: new Date(before),
        outFilePrefix,
    };
    const repoName = path.parse(repoFolderPath).name;
    const _commmitStreamFiltered = _commitStream.pipe(
        filter((commit: GitCommitEnriched) => {
            const _after = new Date(after);
            const _before = new Date(before);
            const commitDate = new Date(commit.committerDate);
            const isAfter = after ? commitDate > _after : true;
            const isBefore = before ? commitDate < _before : true;
            return isAfter && isBefore;
        }),
    );

    const generators: ((_projectInfo: ProjectInfo) => Observable<Report>)[] = [];

    if (!reports || reports.length === 0) {
        reports = allReports;
    }

    reports.forEach((r) => {
        switch (r) {
            case FileChurnReport.name:
                generators.push(fileChurnReportGenerator(_filesStream, params, repoName));
                break;
            case ModuleChurnReport.name:
                generators.push(moduleChurnReportGenerator(_filesStream, params, repoName));
                break;
            case AuthorChurnReport.name:
                generators.push(authorChurnReportGenerator(_commmitStreamFiltered, params, repoName));
                break;
            case FileAuthorsReport.name:
                generators.push(fileAuthorsReportGenerator(_filesStream, params, repoName));
                break;
            case FilesCouplingReport.name:
                generators.push(fileCouplingReportGenerator(_commitStream, params, depthInFilesCoupling, repoName));
                break;
            default:
                throw new Error(`Report ${r} not known`);
        }
    });

    return projectInfo(_commitStream, _clocSummaryStream).pipe(
        map((prjInfo) => generators.map((g) => g(prjInfo))),
        concatMap((generators) => forkJoin(generators)),
    );
}
