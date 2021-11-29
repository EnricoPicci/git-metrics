"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReportsFromStreams = exports._streams = exports.runReports = exports.allReports = void 0;
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
const report_generators_1 = require("./report-generators");
exports.allReports = [
    file_churn_report_1.FileChurnReport.name,
    module_churn_report_1.ModuleChurnReport.name,
    author_churn_report_1.AuthorChurnReport.name,
    file_authors_report_1.FileAuthorsReport.name,
    file_coupling_report_1.FilesCouplingReport.name,
];
function runReports(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, parallelReadOfCommits, noRenames, depthInFilesCoupling) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read the data from git and cloc tool
    const commitOptions = { repoFolderPath, outDir, filter, noRenames };
    const readClocOptions = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    // generation of the source streams
    const { _commitStream, _filesStream, _clocSummaryStream } = _streams(commitLogPath, clocLogPath, clocSummaryPath, parallelReadOfCommits, after, before);
    // run the reports
    return runReportsFromStreams(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream);
}
exports.runReports = runReports;
function _streams(commitLogPath, clocLogPath, clocSummaryPath, parallelRead, after, before) {
    const _after = new Date(after);
    const _before = new Date(before);
    const _enrichedCommitsStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    const _commitStream = parallelRead ? _enrichedCommitsStream : _enrichedCommitsStream.pipe((0, operators_1.share)());
    const _filesStream = parallelRead
        ? (0, files_1.filesStream)(commitLogPath, clocLogPath).pipe((0, operators_1.filter)((file) => {
            const commitDate = new Date(file.committerDate);
            const isAfter = after ? commitDate > _after : true;
            const isBefore = before ? commitDate < _before : true;
            return isAfter && isBefore;
        }))
        : (0, files_1.filesStreamFromEnrichedCommitsStream)(_commitStream).pipe((0, operators_1.filter)((file) => {
            const commitDate = new Date(file.committerDate);
            const isAfter = after ? commitDate > _after : true;
            const isBefore = before ? commitDate < _before : true;
            return isAfter && isBefore;
        }), (0, operators_1.share)());
    const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
    return { _commitStream, _filesStream, _clocSummaryStream };
}
exports._streams = _streams;
function runReportsFromStreams(reports, repoFolderPath, _filter, after, before, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream) {
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
    const _commmitStreamFiltered = _commitStream.pipe((0, operators_1.filter)((commit) => {
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
                generators.push((0, report_generators_1.fileChurnReportGenerator)(_filesStream, params, repoName));
                break;
            case module_churn_report_1.ModuleChurnReport.name:
                generators.push((0, report_generators_1.moduleChurnReportGenerator)(_filesStream, params, repoName));
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
    return (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream).pipe((0, operators_1.map)((prjInfo) => generators.map((g) => g(prjInfo))), (0, operators_1.concatMap)((generators) => (0, rxjs_1.forkJoin)(generators)));
}
exports.runReportsFromStreams = runReportsFromStreams;
//# sourceMappingURL=run-reports-on-repo-core.js.map