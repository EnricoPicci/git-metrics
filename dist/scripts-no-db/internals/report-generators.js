"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchesReportGenerator = exports.fileCouplingReportGenerator = exports.fileAuthorsReportGenerator = exports.authorChurnReportGenerator = exports.moduleChurnReportGenerator = exports.fileChurnReportGenerator = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const author_churn_aggregate_1 = require("../../aggregate-in-memory/author-churn-aggregate");
const commit_branch_tips_aggregate_1 = require("../../aggregate-in-memory/commit-branch-tips-aggregate");
const file_authors_aggregate_1 = require("../../aggregate-in-memory/file-authors-aggregate");
const file_churn_aggregate_1 = require("../../aggregate-in-memory/file-churn-aggregate");
const file_coupling_aggregate_1 = require("../../aggregate-in-memory/file-coupling-aggregate");
const module_churn_aggregate_1 = require("../../aggregate-in-memory/module-churn-aggregate");
const add_project_info_1 = require("../../reports/add-project-info");
const author_churn_report_1 = require("../../reports/author-churn-report");
const branches_report_1 = require("../../reports/branches-report");
const file_authors_report_1 = require("../../reports/file-authors-report");
const file_churn_report_1 = require("../../reports/file-churn-report");
const file_coupling_report_1 = require("../../reports/file-coupling-report");
const module_churn_report_1 = require("../../reports/module-churn-report");
function fileChurnReportGenerator(_filesStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileChurn = outFilePrefix ? `${outFilePrefix}-files-churn.csv` : `${repoName}-files-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFileChurn);
    // aggregation
    const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, params.after);
    // report generations
    return (_projectInfo) => (0, file_churn_report_1.fileChurnReportCore)(_fileChurn, params, csvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, file_churn_report_1.addConsiderationsForFileChurnReport)(_report);
    }));
}
exports.fileChurnReportGenerator = fileChurnReportGenerator;
function moduleChurnReportGenerator(_filesStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outModuleChurn = outFilePrefix ? `${outFilePrefix}-module-churn.csv` : `${repoName}-module-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outModuleChurn);
    // aggregation
    // we need an instance of stream of FileChurn objects, different from the one used for FileChurnReport, since such stream contains state, e.g. the dictionary of files
    // which is built by looping through all files in the files stream
    // if we do not have a different instance, we end up having a state which is wrong since it is built by looping too many times over the same
    // files stream
    const _secondFileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, params.after);
    const _moduleChurn = (0, module_churn_aggregate_1.moduleChurns)(_secondFileChurn);
    // report generations
    return (_projectInfo) => (0, module_churn_report_1.moduleChurnReportCore)(_moduleChurn, params, csvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, module_churn_report_1.addConsiderationsForModuleChurnReport)(_report);
    }));
}
exports.moduleChurnReportGenerator = moduleChurnReportGenerator;
function authorChurnReportGenerator(_commitStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outAuthorChurn = outFilePrefix ? `${outFilePrefix}-authors-churn..csv` : `${repoName}-authors-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outAuthorChurn);
    // aggregation
    const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
    // report generations
    return (_projectInfo) => (0, author_churn_report_1.authorChurnReportCore)(_authorChurn, params, csvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, author_churn_report_1.addConsiderationsForAuthorChurnReport)(_report);
    }));
}
exports.authorChurnReportGenerator = authorChurnReportGenerator;
function fileAuthorsReportGenerator(_filesStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFilesAuthors = outFilePrefix ? `${outFilePrefix}-files-authors.csv` : `${repoName}-files-authors-.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFilesAuthors);
    // aggregation
    const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
    // report generations
    return (_projectInfo) => (0, file_authors_report_1.fileAuthorsReportCore)(_fileAuthors, params, csvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, file_authors_report_1.addConsiderationsForFileAuthorsReport)(_report);
    }));
}
exports.fileAuthorsReportGenerator = fileAuthorsReportGenerator;
function fileCouplingReportGenerator(_commitStream, params, depthInFilesCoupling, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFilesCoupling = outFilePrefix ? `${outFilePrefix}-files-coupling.csv` : `${repoName}-files-coupling.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFilesCoupling);
    // aggregation
    const _fileCoupling = (0, file_coupling_aggregate_1.fileCoupling)(_commitStream, depthInFilesCoupling, params.after);
    // report generations
    return (_projectInfo) => (0, file_coupling_report_1.fileCouplingReportCore)(_fileCoupling, params, csvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, file_coupling_report_1.addConsiderationsForFilesCouplingReport)(_report);
    }));
}
exports.fileCouplingReportGenerator = fileCouplingReportGenerator;
function branchesReportGenerator(_commitStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileBranches = outFilePrefix ? `${outFilePrefix}-branches.csv` : `${repoName}-branches.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFileBranches);
    const _outFileWeeklyBranches = outFilePrefix
        ? `${outFilePrefix}-branches-weekly.csv`
        : `${repoName}-branches-weekly.csv`;
    const weeklyCsvFilePath = path_1.default.join(outDir, _outFileWeeklyBranches);
    // aggregation
    const _daylySummaryDictionary = _commitStream.pipe((0, commit_branch_tips_aggregate_1.commitDaylySummary)());
    // report generations
    return (_projectInfo) => (0, branches_report_1.branchesReportCore)(_daylySummaryDictionary, params, csvFilePath, weeklyCsvFilePath).pipe((0, rxjs_1.map)((_report) => {
        (0, add_project_info_1.addProjectInfo)(_report, _projectInfo, csvFilePath);
        return (0, branches_report_1.addConsiderationsForBranchesReport)(_report);
    }));
}
exports.branchesReportGenerator = branchesReportGenerator;
//# sourceMappingURL=report-generators.js.map