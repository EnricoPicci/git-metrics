import path from 'path';
import { forkJoin, Observable, concatMap, filter, map, share, toArray } from 'rxjs';

import { readAll, readAllParallel, readStreamsDistinctProcesses } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';

import { enrichedCommitsStream } from '../../1-B-git-enriched-streams/commits';
import { filesStream, filesStreamFromEnrichedCommitsStream } from '../../1-B-git-enriched-streams/files';
import { FileGitCommitEnriched } from '../../1-B-git-enriched-types/git-types';
import { CommitWithFileNumstats } from "../../../../git-functions/commit.model";

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
import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { addWorksheet, summaryWorkbook, writeWorkbook } from '../../1-E-summary-excel/summary-excel';
import { commitWithFileNumstatsEnrichedWithCloc$ } from '../../../../git-cloc-functions/commit-cloc.functions';
import { clocSummaryCsvRaw$ } from '../../../../cloc-functions/cloc';
import { GitLogCommitParams } from '../../../../git-functions/git-params';
import { ClocParams } from '../../../../cloc-functions/cloc-params';
import { clocFileDictFromClocStream$ } from '../../../../cloc-functions/cloc-dictionary';

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
    after: Date,
    before: Date,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // read the data from git and cloc tool
    const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const clocParams: ClocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
    const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, clocParams);

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
    after: Date,
    before: Date,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
) {
    // this check is set to avoid that the caller forgets to pass Date objects (which occured to me after a refactor)
    if (!(before instanceof Date) || !(after instanceof Date)) {
        throw new Error('before and after must be Date objects');
    }

    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // read from git log and cloc
    const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const clocParams: ClocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
    return readAllParallel(commitOptions, clocParams).pipe(
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
    after: Date,
    before: Date,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    noRenames: boolean,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // streams that read from git log and cloc
    const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter: _filter, noRenames, reverse: true };
    const clocParams: ClocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
    const { gitLogCommits, cloc, clocSummary } = readStreamsDistinctProcesses(commitOptions, clocParams);

    // enrich git log streams
    const clocDict = clocFileDictFromClocStream$(cloc);
    let _commitStream = commitWithFileNumstatsEnrichedWithCloc$(gitLogCommits, clocDict).pipe(
        map(c => {
            console.log(c)
            return c
        })
    )
    _commitStream = after ? _commitStream.pipe(filter((c) => c.committerDate > after)) : _commitStream;
    _commitStream = _commitStream.pipe(share());

    const _filesStream = filesStreamFromEnrichedCommitsStream(_commitStream).pipe(
        filter((file) => {
            const commitDate = new Date(file.committerDate);
            const isAfter = after ? commitDate > after : true;
            const isBefore = before ? commitDate < before : true;
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
    const _clocSummaryStream = clocSummaryCsvRaw$(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}

export function _runReportsFromStreams(
    reports: string[],
    repoFolderPath: string,
    _filter: string[],
    after: Date,
    before: Date,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
    _commitStream: Observable<CommitWithFileNumstats>,
    _filesStream: Observable<FileGitCommitEnriched>,
    _clocSummaryStream: Observable<string[]>,
) {
    const params: ReportParams = {
        repoFolderPath,
        outDir,
        filter: _filter,
        clocDefsPath,
        after,
        before,
        outFilePrefix,
    };
    const repoName = path.parse(repoFolderPath).name;
    const _commmitStreamFiltered = _commitStream.pipe(
        filter((commit: CommitWithFileNumstats) => {
            const commitDate = new Date(commit.committerDate);
            const isAfter = after ? commitDate > after : true;
            const isBefore = before ? commitDate < before : true;
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
            const reports = prjInfoAndReports.slice(1) as Report[]
            return reports.map((report: Report) => {
                addProjectInfo(report, prjInfo);
                return report.addConsiderations();
            });
        }),
        concatMap((reports) => {
            return writeSummaryWorkbook(reports, outDir, repoName).pipe(
                map((summaryReportPath) => {
                    return { reports, summaryReportPath };
                }),
            );
        }),
    );
}

function writeSummaryWorkbook(reports: Report[], outDir: string, repoName: string) {
    const workbook = summaryWorkbook();
    const addSheetsForReports = reports.map((report) => {
        const csvFile = report.csvFile?.val || report.name + '-csv-report.csv';
        return addWorksheet(workbook, report.name, csvFile);
    });
    return forkJoin(addSheetsForReports).pipe(
        map(() => {
            const wbName = `${repoName}-summary-${new Date().toISOString()}`
            const wbPathName = writeWorkbook(workbook, outDir, `${wbName}`);
            console.log(`====>>>> Summary report excel written to ${wbPathName}`);
            return wbPathName;
        }),
    );
}
