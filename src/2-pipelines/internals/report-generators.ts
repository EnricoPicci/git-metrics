import path from 'path';
import { Observable } from 'rxjs';
import { authorChurn } from '../../1-C-aggregate-in-memory/author-churn-aggregate';
import { fileAuthors } from '../../1-C-aggregate-in-memory/file-authors-aggregate';
import { fileChurn } from '../../1-C-aggregate-in-memory/file-churn-aggregate';
import { fileCoupling } from '../../1-C-aggregate-in-memory/file-coupling-aggregate';
import { moduleChurns } from '../../1-C-aggregate-in-memory/module-churn-aggregate';
import { FileGitCommitEnriched, GitCommitEnriched } from '../../1-B-git-enriched-types/git-types';
import { authorChurnReportCore } from '../../1-D-reports/author-churn-report';
import { fileAuthorsReportCore } from '../../1-D-reports/file-authors-report';
import { fileChurnReportCore } from '../../1-D-reports/file-churn-report';
import { fileCouplingReportCore } from '../../1-D-reports/file-coupling-report';
import { moduleChurnReportCore } from '../../1-D-reports/module-churn-report';
import { ReportParams } from '../../1-D-reports/report';

export function fileChurnReportGenerator(
    _filesStream: Observable<FileGitCommitEnriched>,
    params: ReportParams,
    repoName: string,
    ignoreClocZero: boolean,
) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileChurn = outFilePrefix ? `${outFilePrefix}-files-churn.csv` : `${repoName}-files-churn.csv`;
    const csvFilePath = path.join(outDir, _outFileChurn);
    // aggregation
    const _fileChurn = fileChurn(_filesStream, ignoreClocZero, params.after);
    // report generations
    return fileChurnReportCore(_fileChurn, params, csvFilePath);
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
    // we can not reuse the same stream of FileChurn objects used for FileChurnReport,
    // we need an instance of stream of FileChurn objects, different from the one used for FileChurnReport,
    // since such stream contains state, e.g. the dictionary of files which is built by looping through all files in the files stream
    // if we do not have a different instance, we end up having a state which is wrong since it is built by looping
    // too many times over the same files stream
    const _secondFileChurn = fileChurn(_filesStream, true, params.after);
    const _moduleChurn = moduleChurns(_secondFileChurn);
    // report generations
    return moduleChurnReportCore(_moduleChurn, params, csvFilePath);
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
    return authorChurnReportCore(_authorChurn, params, csvFilePath);
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
    return fileAuthorsReportCore(_fileAuthors, params, csvFilePath);
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
    return fileCouplingReportCore(_fileCoupling, params, csvFilePath);
}
