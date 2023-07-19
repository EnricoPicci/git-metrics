import path from 'path';
import { forkJoin, Observable, concatMap, filter, map, share, toArray } from 'rxjs';

import { ConfigReadCommits, ConfigReadCloc } from '../../1-A-read/read-params/read-params';
import { readAll, readAllParallel, readStreamsDistinctProcesses } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';
import { clocSummaryStream } from '../../1-A-read/cloc';

import { enrichedCommitsStream, newGitCommit, toCommits } from '../../1-B-git-enriched-streams/commits';
import { filesStream, filesStreamFromEnrichedCommitsStream } from '../../1-B-git-enriched-streams/files';
import { FileGitCommitEnriched, GitCommitEnriched } from '../../1-B-git-enriched-types/git-types';

import { projectInfo } from '../../1-C-aggregate-in-memory/project-info-aggregate';

import { FILE_CHURN_REPORT_NAME, FileChurnReport } from '../../1-D-reports/file-churn-report';
import { AUTHOR_CHURN_REPORT_NAME, AuthorChurnReport } from '../../1-D-reports/author-churn-report';
import { FILE_AUTHORS_REPORT_NAME, FileAuthorsReport } from '../../1-D-reports/file-authors-report';
import { FilesCouplingReport } from '../../1-D-reports/file-coupling-report';
import { MODULE_CHURN_REPORT_NAME, ModuleChurnReport } from '../../1-D-reports/module-churn-report';
import { Report, ReportParams } from '../../1-D-reports/report';

import {
    fileChurnReportGenerator,
    moduleChurnReportGenerator,
    authorChurnReportGenerator,
    fileAuthorsReportGenerator,
    fileCouplingReportGenerator,
} from './report-generators';
import { toClocFileDict } from '../../1-B-git-enriched-streams/read-cloc-log';
import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { addWorksheet, summaryWorkbook, writeWorkbook } from '../../1-E-summary-excel/summary-excel';

export const allReports = [
    FILE_CHURN_REPORT_NAME,
    MODULE_CHURN_REPORT_NAME,
    AUTHOR_CHURN_REPORT_NAME,
    FILE_AUTHORS_REPORT_NAME,
    // FilesCouplingReport.name,
];

/*********************************************/
//********************* APIs *****************/
/*********************************************/

// runs the reports in the same main Node thread
export function runReportsSingleThread(
    reports: string[],
    repoFolderPath: string,
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
    ignoreClocZero: boolean,
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
        concurrentReadOfCommits,
    );

    // run the reports
    return _runReportsFromStreams(
        reports,
        repoFolderPath,
        filter,
        after,
        before,
        outDir,
        outFilePrefix,
        clocDefsPath,
        ignoreClocZero,
        depthInFilesCoupling,
        _commitStream,
        _filesStream,
        _clocSummaryStream,
    );
}

// runs the read operations which create the commit and the cloc files in parallel distinct processes and then reads the output files created
// by the read operations to generate the reports - the report generation is performend concurrently in the main Node process
export function runReportsParallelReads(
    reports: string[],
    repoFolderPath: string,
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
    ignoreClocZero: boolean,
    depthInFilesCoupling?: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // read from git log and cloc
    const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
    return readAllParallel(commitOptions, readClocOptions).pipe(
        // prepare the streams of git enriched objects
        map(([commitLogPath, clocLogPath, clocSummaryPath]) => {
            return _streams(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits);
        }),
        // run the aggregation logic and the reports
        concatMap(({ _commitStream, _filesStream, _clocSummaryStream }) =>
            _runReportsFromStreams(
                reports,
                repoFolderPath,
                filter,
                after,
                before,
                outDir,
                outFilePrefix,
                clocDefsPath,
                ignoreClocZero,
                depthInFilesCoupling,
                _commitStream,
                _filesStream,
                _clocSummaryStream,
            ),
        ),
    );
}

// runs the read operations, i.e. reads the commits and executes the cloc commands, in separate processes which stream the output of the read operations
// into the main Node process. Such streams are then used to generate the reports. This means that we can generate the reports without having to
// write the output of "git log" and "cloc" commands into intermediate files.
export function runReportsOneStream(
    reports: string[],
    repoFolderPath: string,
    _filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    noRenames: boolean,
    ignoreClocZero: boolean,
    depthInFilesCoupling?: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    const _after = new Date(after);
    const _before = new Date(before);

    // streams that read from git log and cloc
    const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter: _filter, noRenames, reverse: true };
    const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
    const { gitLogCommits, cloc, clocSummary } = readStreamsDistinctProcesses(commitOptions, readClocOptions);

    // enrich git log streams
    const clocDict = cloc.pipe(toArray(), toClocFileDict());
    let _commitStream = clocDict.pipe(
        concatMap((clocDict) =>
            gitLogCommits.pipe(
                filter((line) => line.length > 0),
                toCommits(),
                map((commit) => newGitCommit(commit, clocDict)),
            ),
        ),
    );
    _commitStream = after ? _commitStream.pipe(filter((c) => c.committerDate > _after)) : _commitStream;
    _commitStream = _commitStream.pipe(share());

    const _filesStream = filesStreamFromEnrichedCommitsStream(_commitStream).pipe(
        filter((file) => {
            const commitDate = new Date(file.committerDate);
            const isAfter = after ? commitDate > _after : true;
            const isBefore = before ? commitDate < _before : true;
            return isAfter && isBefore;
        }),
        share(),
    );

    const _clocSummaryStream = clocSummary.pipe(toArray());

    return _runReportsFromStreams(
        reports,
        repoFolderPath,
        _filter,
        after,
        before,
        outDir,
        outFilePrefix,
        clocDefsPath,
        ignoreClocZero,
        depthInFilesCoupling,
        _commitStream,
        _filesStream,
        _clocSummaryStream,
    );
}

//********************* Internal functions exported becaused used by APIs defined in other files *****************/
// If parallelRead is true, then the cloc log is read in parallel to create the commitStream and the filesStream.
// Otherwise, the cloc log is read only once to create the commitStream and the filesStream is created from the commitStream.
export function _streams(commitLogPath: string, clocLogPath: string, clocSummaryPath: string, parallelRead: boolean) {
    const _enrichedCommitsStream = enrichedCommitsStream(commitLogPath, clocLogPath);
    const _commitStream = parallelRead ? _enrichedCommitsStream : _enrichedCommitsStream.pipe(share());
    const _filesStream = parallelRead
        ? filesStream(commitLogPath, clocLogPath)
        : filesStreamFromEnrichedCommitsStream(_commitStream).pipe(share());
    const _clocSummaryStream = clocSummaryStream(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}

export function _runReportsFromStreams(
    reports: string[],
    repoFolderPath: string,
    _filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    ignoreClocZero: boolean,
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

    const generators: Observable<Report>[] = [];

    if (!reports || reports.length === 0) {
        reports = allReports;
    }

    reports.forEach((r) => {
        switch (r) {
            case FileChurnReport.name:
                generators.push(fileChurnReportGenerator(_filesStream, params, repoName, ignoreClocZero));
                break;
            case ModuleChurnReport.name:
                generators.push(moduleChurnReportGenerator(_filesStream, params, repoName, ignoreClocZero));
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

    return forkJoin([projectInfo(_commitStream, _clocSummaryStream), ...generators]).pipe(
        map((prjInfoAndReports) => {
            const prjInfo = prjInfoAndReports[0];
            return prjInfoAndReports.slice(1).map((report: Report) => {
                addProjectInfo(report, prjInfo);
                return report.addConsiderations();
            });
        }),
        concatMap((reports) => {
            return writeSummaryWorkbook(reports, outDir, repoName).pipe(
                map(() => {
                    return reports;
                }),
            );
        }),
    );
}

function writeSummaryWorkbook(reports: Report[], outDir: string, repoName: string) {
    const workbook = summaryWorkbook();
    const addSheetsForReports = reports.map((report) => {
        return addWorksheet(workbook, report.name, report.csvFile.val);
    });
    return forkJoin(addSheetsForReports).pipe(
        map(() => {
            const wbName = writeWorkbook(workbook, outDir, `${repoName}-summary-${new Date().toISOString()}`);
            console.log(`====>>>> Summary report excel written to ${wbName}`);
            return wbName;
        }),
    );
}
