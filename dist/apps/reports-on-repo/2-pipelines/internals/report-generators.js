"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileCouplingReportGenerator = exports.fileAuthorsReportGenerator = exports.authorChurnReportGenerator = exports.moduleChurnReportGenerator = exports.fileChurnReportGenerator = void 0;
const path_1 = __importDefault(require("path"));
const author_churn_aggregate_1 = require("../../1-C-aggregate-in-memory/author-churn-aggregate");
const file_authors_aggregate_1 = require("../../1-C-aggregate-in-memory/file-authors-aggregate");
const file_churn_aggregate_1 = require("../../1-C-aggregate-in-memory/file-churn-aggregate");
const file_coupling_aggregate_1 = require("../../1-C-aggregate-in-memory/file-coupling-aggregate");
const module_churn_aggregate_1 = require("../../1-C-aggregate-in-memory/module-churn-aggregate");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const file_authors_report_1 = require("../../1-D-reports/file-authors-report");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const file_coupling_report_1 = require("../../1-D-reports/file-coupling-report");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
function fileChurnReportGenerator(_filesStream, params, repoName, ignoreClocZero) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFileChurn = outFilePrefix ? `${outFilePrefix}-files-churn.csv` : `${repoName}-files-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFileChurn);
    // aggregation
    const _fileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, ignoreClocZero, params.after);
    // report generations
    return (0, file_churn_report_1.fileChurnReportCore)(_fileChurn, params, csvFilePath);
}
exports.fileChurnReportGenerator = fileChurnReportGenerator;
function moduleChurnReportGenerator(_filesStream, params, repoName, ignoreClocZero) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outModuleChurn = outFilePrefix ? `${outFilePrefix}-module-churn.csv` : `${repoName}-module-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outModuleChurn);
    // aggregation
    // we can not reuse the same stream of FileChurn objects used for FileChurnReport,
    // we need an instance of stream of FileChurn objects, different from the one used for FileChurnReport,
    // since such stream contains state, e.g. the dictionary of files which is built by looping through all files in the files stream
    // if we do not have a different instance, we end up having a state which is wrong since it is built by looping
    // too many times over the same files stream
    const _secondFileChurn = (0, file_churn_aggregate_1.fileChurn)(_filesStream, ignoreClocZero, params.after);
    const _moduleChurn = (0, module_churn_aggregate_1.moduleChurns)(_secondFileChurn);
    // report generations
    return (0, module_churn_report_1.moduleChurnReportCore)(_moduleChurn, params, csvFilePath);
}
exports.moduleChurnReportGenerator = moduleChurnReportGenerator;
function authorChurnReportGenerator(_commitStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outAuthorChurn = outFilePrefix ? `${outFilePrefix}-authors-churn.csv` : `${repoName}-authors-churn.csv`;
    const csvFilePath = path_1.default.join(outDir, _outAuthorChurn);
    // aggregation
    const _authorChurn = (0, author_churn_aggregate_1.authorChurn)(_commitStream, params.after);
    // report generations
    return (0, author_churn_report_1.authorChurnReportCore)(_authorChurn, params, csvFilePath);
}
exports.authorChurnReportGenerator = authorChurnReportGenerator;
function fileAuthorsReportGenerator(_filesStream, params, repoName) {
    const outDir = params.outDir;
    const outFilePrefix = params.outFilePrefix;
    const _outFilesAuthors = outFilePrefix ? `${outFilePrefix}-files-authors.csv` : `${repoName}-files-authors.csv`;
    const csvFilePath = path_1.default.join(outDir, _outFilesAuthors);
    // aggregation
    const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
    // report generations
    return (0, file_authors_report_1.fileAuthorsReportCore)(_fileAuthors, params, csvFilePath);
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
    return (0, file_coupling_report_1.fileCouplingReportCore)(_fileCoupling, params, csvFilePath);
}
exports.fileCouplingReportGenerator = fileCouplingReportGenerator;
//# sourceMappingURL=report-generators.js.map