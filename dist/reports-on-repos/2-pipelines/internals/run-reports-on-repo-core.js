"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._runReportsFromStreams = exports._streams = exports.runReportsOneStream = exports.runReportsParallelReads = exports.runReportsSingleThread = exports.allReports = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const read_all_1 = require("../../1-A-read/read-all");
const create_outdir_1 = require("../../1-A-read/create-outdir");
const cloc_1 = require("../../1-A-read/cloc");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const files_1 = require("../../1-B-git-enriched-streams/files");
const project_info_aggregate_1 = require("../../1-C-aggregate-in-memory/project-info-aggregate");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const file_authors_report_1 = require("../../1-D-reports/file-authors-report");
const file_coupling_report_1 = require("../../1-D-reports/file-coupling-report");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
const report_generators_1 = require("./report-generators");
const read_cloc_log_1 = require("../../1-B-git-enriched-streams/read-cloc-log");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const summary_excel_1 = require("../../1-E-summary-excel/summary-excel");
exports.allReports = [
    file_churn_report_1.FILE_CHURN_REPORT_NAME,
    module_churn_report_1.MODULE_CHURN_REPORT_NAME,
    author_churn_report_1.AUTHOR_CHURN_REPORT_NAME,
    file_authors_report_1.FILE_AUTHORS_REPORT_NAME,
    // FilesCouplingReport.name,
];
/*********************************************/
//********************* APIs *****************/
/*********************************************/
// runs the reports in the same main Node thread
function runReportsSingleThread(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero, depthInFilesCoupling) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read the data from git and cloc tool
    const commitOptions = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const readClocOptions = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    // generation of the source streams
    const { _commitStream, _filesStream, _clocSummaryStream } = _streams(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits);
    // run the reports
    return _runReportsFromStreams(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream);
}
exports.runReportsSingleThread = runReportsSingleThread;
// runs the read operations which create the commit and the cloc files in parallel distinct processes and then reads the output files created
// by the read operations to generate the reports - the report generation is performend concurrently in the main Node process
function runReportsParallelReads(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero, depthInFilesCoupling) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read from git log and cloc
    const commitOptions = { repoFolderPath, outDir, filter, noRenames, reverse: true };
    const readClocOptions = { repoFolderPath, outDir };
    return (0, read_all_1.readAllParallel)(commitOptions, readClocOptions).pipe(
    // prepare the streams of git enriched objects
    (0, rxjs_1.map)(([commitLogPath, clocLogPath, clocSummaryPath]) => {
        return _streams(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits);
    }), 
    // run the aggregation logic and the reports
    (0, rxjs_1.concatMap)(({ _commitStream, _filesStream, _clocSummaryStream }) => _runReportsFromStreams(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream)));
}
exports.runReportsParallelReads = runReportsParallelReads;
// runs the read operations, i.e. reads the commits and executes the cloc commands, in separate processes which stream the output of the read operations
// into the main Node process. Such streams are then used to generate the reports. This means that we can generate the reports without having to
// write the output of "git log" and "cloc" commands into intermediate files.
function runReportsOneStream(reports, repoFolderPath, _filter, after, before, outDir, outFilePrefix, clocDefsPath, noRenames, ignoreClocZero, depthInFilesCoupling) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const _after = new Date(after);
    const _before = new Date(before);
    // streams that read from git log and cloc
    const commitOptions = { repoFolderPath, outDir, filter: _filter, noRenames, reverse: true };
    const readClocOptions = { repoFolderPath, outDir };
    const { gitLogCommits, cloc, clocSummary } = (0, read_all_1.readStreamsDistinctProcesses)(commitOptions, readClocOptions);
    // enrich git log streams
    const clocDict = cloc.pipe((0, rxjs_1.toArray)(), (0, read_cloc_log_1.toClocFileDict)());
    let _commitStream = clocDict.pipe((0, rxjs_1.concatMap)((clocDict) => gitLogCommits.pipe((0, rxjs_1.filter)((line) => line.length > 0), (0, commits_1.toCommits)(), (0, rxjs_1.map)((commit) => (0, commits_1.newGitCommit)(commit, clocDict)))));
    _commitStream = after ? _commitStream.pipe((0, rxjs_1.filter)((c) => c.committerDate > _after)) : _commitStream;
    _commitStream = _commitStream.pipe((0, rxjs_1.share)());
    const _filesStream = (0, files_1.filesStreamFromEnrichedCommitsStream)(_commitStream).pipe((0, rxjs_1.filter)((file) => {
        const commitDate = new Date(file.committerDate);
        const isAfter = after ? commitDate > _after : true;
        const isBefore = before ? commitDate < _before : true;
        return isAfter && isBefore;
    }), (0, rxjs_1.share)());
    const _clocSummaryStream = clocSummary.pipe((0, rxjs_1.toArray)());
    return _runReportsFromStreams(reports, repoFolderPath, _filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream);
}
exports.runReportsOneStream = runReportsOneStream;
//********************* Internal functions exported becaused used by APIs defined in other files *****************/
// If parallelRead is true, then the cloc log is read in parallel to create the commitStream and the filesStream.
// Otherwise, the cloc log is read only once to create the commitStream and the filesStream is created from the commitStream.
function _streams(commitLogPath, clocLogPath, clocSummaryPath, parallelRead) {
    const _enrichedCommitsStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    const _commitStream = parallelRead ? _enrichedCommitsStream : _enrichedCommitsStream.pipe((0, rxjs_1.share)());
    const _filesStream = parallelRead
        ? (0, files_1.filesStream)(commitLogPath, clocLogPath)
        : (0, files_1.filesStreamFromEnrichedCommitsStream)(_commitStream).pipe((0, rxjs_1.share)());
    const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}
exports._streams = _streams;
function _runReportsFromStreams(reports, repoFolderPath, _filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream) {
    const params = {
        repoFolderPath,
        outDir,
        filter: _filter,
        clocDefsPath,
        after: new Date(after),
        before: new Date(before),
        outFilePrefix,
    };
    const repoName = path_1.default.parse(repoFolderPath).name;
    const _commmitStreamFiltered = _commitStream.pipe((0, rxjs_1.filter)((commit) => {
        const _after = new Date(after);
        const _before = new Date(before);
        const commitDate = new Date(commit.committerDate);
        const isAfter = after ? commitDate > _after : true;
        const isBefore = before ? commitDate < _before : true;
        return isAfter && isBefore;
    }));
    const generators = [];
    if (!reports || reports.length === 0) {
        reports = exports.allReports;
    }
    reports.forEach((r) => {
        switch (r) {
            case file_churn_report_1.FileChurnReport.name:
                generators.push((0, report_generators_1.fileChurnReportGenerator)(_filesStream, params, repoName, ignoreClocZero));
                break;
            case module_churn_report_1.ModuleChurnReport.name:
                generators.push((0, report_generators_1.moduleChurnReportGenerator)(_filesStream, params, repoName, ignoreClocZero));
                break;
            case author_churn_report_1.AuthorChurnReport.name:
                generators.push((0, report_generators_1.authorChurnReportGenerator)(_commmitStreamFiltered, params, repoName));
                break;
            case file_authors_report_1.FileAuthorsReport.name:
                generators.push((0, report_generators_1.fileAuthorsReportGenerator)(_filesStream, params, repoName));
                break;
            case file_coupling_report_1.FilesCouplingReport.name:
                generators.push((0, report_generators_1.fileCouplingReportGenerator)(_commitStream, params, depthInFilesCoupling, repoName));
                break;
            default:
                throw new Error(`Report ${r} not known`);
        }
    });
    return (0, rxjs_1.forkJoin)([(0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream), ...generators]).pipe((0, rxjs_1.map)((prjInfoAndReports) => {
        const prjInfo = prjInfoAndReports[0];
        const reports = prjInfoAndReports.slice(1);
        return reports.map((report) => {
            (0, add_project_info_1.addProjectInfo)(report, prjInfo);
            return report.addConsiderations();
        });
    }), (0, rxjs_1.concatMap)((reports) => {
        return writeSummaryWorkbook(reports, outDir, repoName).pipe((0, rxjs_1.map)(() => {
            return reports;
        }));
    }));
}
exports._runReportsFromStreams = _runReportsFromStreams;
function writeSummaryWorkbook(reports, outDir, repoName) {
    const workbook = (0, summary_excel_1.summaryWorkbook)();
    const addSheetsForReports = reports.map((report) => {
        var _a;
        const csvFile = ((_a = report.csvFile) === null || _a === void 0 ? void 0 : _a.val) || report.name + '-csv-report.csv';
        return (0, summary_excel_1.addWorksheet)(workbook, report.name, csvFile);
    });
    return (0, rxjs_1.forkJoin)(addSheetsForReports).pipe((0, rxjs_1.map)(() => {
        const wbName = (0, summary_excel_1.writeWorkbook)(workbook, outDir, `${repoName}-summary-${new Date().toISOString()}`);
        console.log(`====>>>> Summary report excel written to ${wbName}`);
        return wbName;
    }));
}
//# sourceMappingURL=run-reports-on-repo-core.js.map