import path from 'path';
import { Observable, map } from 'rxjs';
import { authorChurn } from '../../aggregate-in-memory/author-churn-aggregate';
import { commitDaylySummary } from '../../aggregate-in-memory/commit-branch-tips-aggregate';
import { fileAuthors } from '../../aggregate-in-memory/file-authors-aggregate';
import { fileChurn } from '../../aggregate-in-memory/file-churn-aggregate';
import { fileCoupling } from '../../aggregate-in-memory/file-coupling-aggregate';
import { moduleChurns } from '../../aggregate-in-memory/module-churn-aggregate';
import { ProjectInfo } from '../../aggregate-types/project-info';
import { FileGitCommitEnriched, GitCommitEnriched } from '../../git-enriched-types/git-types';
import { addProjectInfo } from '../../reports/add-project-info';
import { authorChurnReportCore, addConsiderationsForAuthorChurnReport } from '../../reports/author-churn-report';
import { addConsiderationsForBranchesReport, branchesReportCore } from '../../reports/branches-report';
import { fileAuthorsReportCore, addConsiderationsForFileAuthorsReport } from '../../reports/file-authors-report';
import { fileChurnReportCore, addConsiderationsForFileChurnReport } from '../../reports/file-churn-report';
import { fileCouplingReportCore, addConsiderationsForFilesCouplingReport } from '../../reports/file-coupling-report';
import { moduleChurnReportCore, addConsiderationsForModuleChurnReport } from '../../reports/module-churn-report';
import { ReportParams } from '../../reports/report';

export function fileChurnReportGenerator(
    _filesStream: Observable<FileGitCommitEnriched>,
    params: ReportParams,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileChurn = outFilePrefix ? `${outFilePrefix}-files-churn.csv` : `${repoName}-files-churn.csv`;
    const csvFilePath = path.join(outDir, _outFileChurn);
    // aggregation
    const _fileChurn = fileChurn(_filesStream, params.after);
    // report generations
    return (_projectInfo: ProjectInfo) =>
        fileChurnReportCore(_fileChurn, params, csvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForFileChurnReport(_report);
            }),
        );
}

export function moduleChurnReportGenerator(
    _filesStream: Observable<FileGitCommitEnriched>,
    params: ReportParams,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outModuleChurn = outFilePrefix ? `${outFilePrefix}-module-churn.csv` : `${repoName}-module-churn.csv`;
    const csvFilePath = path.join(outDir, _outModuleChurn);
    // aggregation
    // we need an instance of stream of FileChurn objects, different from the one used for FileChurnReport, since such stream contains state, e.g. the dictionary of files
    // which is built by looping through all files in the files stream
    // if we do not have a different instance, we end up having a state which is wrong since it is built by looping too many times over the same
    // files stream
    const _secondFileChurn = fileChurn(_filesStream, params.after);
    const _moduleChurn = moduleChurns(_secondFileChurn);
    // report generations
    return (_projectInfo: ProjectInfo) =>
        moduleChurnReportCore(_moduleChurn, params, csvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForModuleChurnReport(_report);
            }),
        );
}

export function authorChurnReportGenerator(
    _commitStream: Observable<GitCommitEnriched>,
    params: ReportParams,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outAuthorChurn = outFilePrefix ? `${outFilePrefix}-authors-churn..csv` : `${repoName}-authors-churn.csv`;
    const csvFilePath = path.join(outDir, _outAuthorChurn);
    // aggregation
    const _authorChurn = authorChurn(_commitStream, params.after);
    // report generations
    return (_projectInfo: ProjectInfo) =>
        authorChurnReportCore(_authorChurn, params, csvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForAuthorChurnReport(_report);
            }),
        );
}

export function fileAuthorsReportGenerator(
    _filesStream: Observable<FileGitCommitEnriched>,
    params: ReportParams,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFilesAuthors = outFilePrefix ? `${outFilePrefix}-files-authors.csv` : `${repoName}-files-authors.csv`;
    const csvFilePath = path.join(outDir, _outFilesAuthors);
    // aggregation
    const _fileAuthors = fileAuthors(_filesStream, params.after);
    // report generations
    return (_projectInfo: ProjectInfo) =>
        fileAuthorsReportCore(_fileAuthors, params, csvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForFileAuthorsReport(_report);
            }),
        );
}

export function fileCouplingReportGenerator(
    _commitStream: Observable<GitCommitEnriched>,
    params: ReportParams,
    depthInFilesCoupling: number,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFilesCoupling = outFilePrefix ? `${outFilePrefix}-files-coupling.csv` : `${repoName}-files-coupling.csv`;
    const csvFilePath = path.join(outDir, _outFilesCoupling);
    // aggregation
    const _fileCoupling = fileCoupling(_commitStream, depthInFilesCoupling, params.after);
    // report generations
    return (_projectInfo: ProjectInfo) =>
        fileCouplingReportCore(_fileCoupling, params, csvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForFilesCouplingReport(_report);
            }),
        );
}

export function branchesReportGenerator(
    _commitStream: Observable<GitCommitEnriched>,
    params: ReportParams,
    repoName: string,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileBranches = outFilePrefix ? `${outFilePrefix}-branches.csv` : `${repoName}-branches.csv`;
    const csvFilePath = path.join(outDir, _outFileBranches);
    const _outFileWeeklyBranches = outFilePrefix
        ? `${outFilePrefix}-branches-weekly.csv`
        : `${repoName}-branches-weekly.csv`;
    const weeklyCsvFilePath = path.join(outDir, _outFileWeeklyBranches);
    // aggregation
    const _daylySummaryDictionary = _commitStream.pipe(commitDaylySummary());
    // report generations
    return (_projectInfo: ProjectInfo) =>
        branchesReportCore(_daylySummaryDictionary, params, csvFilePath, weeklyCsvFilePath).pipe(
            map((_report) => {
                addProjectInfo(_report, _projectInfo, csvFilePath);
                return addConsiderationsForBranchesReport(_report);
            }),
        );
}
