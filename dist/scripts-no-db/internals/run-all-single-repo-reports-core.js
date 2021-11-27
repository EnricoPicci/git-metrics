"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllSingleRepoReportsFromStreams = exports._streams = exports.runAllSingleRepoReports = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const read_all_1 = require("../../git-read-enrich/read-all");
const create_outdir_1 = require("../../git-read-enrich/create-outdir");
const file_churn_report_1 = require("../../reports/file-churn-report");
const files_1 = require("../../git-read-enrich/files");
const commits_1 = require("../../git-read-enrich/commits");
const author_churn_report_1 = require("../../reports/author-churn-report");
const file_authors_report_1 = require("../../reports/file-authors-report");
const file_coupling_report_1 = require("../../reports/file-coupling-report");
const module_churn_report_1 = require("../../reports/module-churn-report");
const cloc_1 = require("../../git-read-enrich/cloc");
const project_info_aggregate_1 = require("../../aggregate-in-memory/project-info-aggregate");
const file_churn_aggregate_1 = require("../../aggregate-in-memory/file-churn-aggregate");
const author_churn_aggregate_1 = require("../../aggregate-in-memory/author-churn-aggregate");
const file_authors_aggregate_1 = require("../../aggregate-in-memory/file-authors-aggregate");
const file_coupling_aggregate_1 = require("../../aggregate-in-memory/file-coupling-aggregate");
const module_churn_aggregate_1 = require("../../aggregate-in-memory/module-churn-aggregate");
const add_project_info_1 = require("../../reports/add-project-info");
function runAllSingleRepoReports(repoFolderPath, filter, after, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, parallelReadOfCommits, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read the data from git and cloc tool
    const commitOptions = { repoFolderPath, outDir, filter, noRenames };
    const readClocOptions = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    // generation of the source streams
    const { _commitStream, _filesStream, _clocSummaryStream } = _streams(commitLogPath, clocLogPath, clocSummaryPath, parallelReadOfCommits);
    // run the reports
    return runAllSingleRepoReportsFromStreams(repoFolderPath, filter, after, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream);
}
exports.runAllSingleRepoReports = runAllSingleRepoReports;
function _streams(commitLogPath, clocLogPath, clocSummaryPath, parallelRead) {
    const _enrichedCommitsStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    const _commitStream = parallelRead ? _enrichedCommitsStream : _enrichedCommitsStream.pipe((0, operators_1.share)());
    const _filesStream = parallelRead
        ? (0, files_1.filesStream)(commitLogPath, clocLogPath)
        : (0, files_1.filesStreamFromEnrichedCommitsStream)(_commitStream).pipe((0, operators_1.share)());
    const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}
exports._streams = _streams;
function runAllSingleRepoReportsFromStreams(repoFolderPath, filter, after, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream) {
    const params = {
        repoFolderPath,
        outDir,
        filter,
        clocDefsPath,
        after: new Date(after),
    };
    const repoName = path_1.default.parse(repoFolderPath).name;
    const _outFileChurn = outFilePrefix ? `${outFilePrefix}-files-churn.csv` : `${repoName}-files-churn.csv`;
    const csvFileChurnPath = path_1.default.join(outDir, _outFileChurn);
    const _outModuleChurn = outFilePrefix ? `${outFilePrefix}-module-churn.csv` : `${repoName}-module-churn.csv`;
    const csvModuleChurnPath = path_1.default.join(outDir, _outModuleChurn);
    const _outAuthorChurn = outFilePrefix ? `${outFilePrefix}-authors-churn..csv` : `${repoName}-authors-churn.csv`;
    const csvAuthorChurnPath = path_1.default.join(outDir, _outAuthorChurn);
    const _outFilesAuthors = outFilePrefix ? `${outFilePrefix}-files-authors.csv` : `${repoName}-files-authors-.csv`;
    const csvFilesAuthors = path_1.default.join(outDir, _outFilesAuthors);
    const _outFilesCoupling = outFilePrefix ? `${outFilePrefix}-files-coupling.csv` : `${repoName}-files-coupling.csv`;
    const csvFilesCoupling = path_1.default.join(outDir, _outFilesCoupling);
    // aggregation
    const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, params.after);
    // we need a second different instance of stream of FileChurn objects since such stream contains state, e.g. the dictionary of files
    // which is built by looping through all files in the files stream
    // if we do not have a different instance, we end up having a state which is wrong since it is built by looping too many times over the same
    // files stream
    const _secondFileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, params.after);
    const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(_secondFileChurn);
    const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
    const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
    const _fileCoupling = (0, file_coupling_aggregate_1.fileCoupling)(_commitStream, depthInFilesCoupling, params.after);
    return (0, rxjs_1.forkJoin)([
        (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream),
        (0, file_churn_report_1.fileChurnReportCore)(_fileChurn, params, csvFileChurnPath),
        (0, module_churn_report_1.moduleChurnReportCore)(moduleChurnsStream, params, csvModuleChurnPath),
        (0, author_churn_report_1.authorChurnReportCore)(_authorChurn, params, csvAuthorChurnPath),
        (0, file_authors_report_1.fileAuthorsReportCore)(_fileAuthors, params, csvFilesAuthors),
        (0, file_coupling_report_1.fileCouplingReportCore)(_fileCoupling, params, csvFilesCoupling),
    ]).pipe((0, operators_1.map)(([_projectInfo, _fileChurnReport, _moduleChurnReport, _authorChurnReport, _fileAuthorsReport, _fileCouplingReport,]) => {
        (0, add_project_info_1.addProjectInfo)(_fileChurnReport, _projectInfo, csvFileChurnPath);
        (0, add_project_info_1.addProjectInfo)(_moduleChurnReport, _projectInfo, csvModuleChurnPath);
        (0, add_project_info_1.addProjectInfo)(_authorChurnReport, _projectInfo, csvAuthorChurnPath);
        (0, add_project_info_1.addProjectInfo)(_fileAuthorsReport, _projectInfo, csvFilesAuthors);
        (0, add_project_info_1.addProjectInfo)(_fileCouplingReport, _projectInfo, csvFilesCoupling);
        return [
            (0, file_churn_report_1.addConsiderationsForFileChurnReport)(_fileChurnReport),
            (0, module_churn_report_1.addConsiderationsForModuleChurnReport)(_moduleChurnReport),
            (0, author_churn_report_1.addConsiderationsForAuthorChurnReport)(_authorChurnReport),
            (0, file_authors_report_1.addConsiderationsForFileAuthorsReport)(_fileAuthorsReport),
            (0, file_coupling_report_1.addConsiderationsForFilesCouplingReport)(_fileCouplingReport),
        ];
    }));
}
exports.runAllSingleRepoReportsFromStreams = runAllSingleRepoReportsFromStreams;
//# sourceMappingURL=run-all-single-repo-reports-core.js.map