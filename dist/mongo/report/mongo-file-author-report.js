"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._mongoFileAuthorReport = exports.mongoFileAuthorReport = exports.mongoFileAuthorReportWithProjectInfo = void 0;
const operators_1 = require("rxjs/operators");
const file_authors_report_1 = require("../../1-D-reports/file-authors-report");
const files_authors_query_1 = require("../query/files-authors-query");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const mongo_report_1 = require("./mongo-report");
// produce a report about how many authors have contributed to a file and general project info
// reading from a mongo db (previously loaded with commit and files info).
// reads also from the repo folder for information about the files currently in the project
function mongoFileAuthorReportWithProjectInfo(params, csvFilePath) {
    return (0, mongo_add_prj_info_1.mongoProjectInfo)(params).pipe((0, operators_1.concatMap)((prjInfo) => mongoFileAuthorReport(params, prjInfo, csvFilePath)));
}
exports.mongoFileAuthorReportWithProjectInfo = mongoFileAuthorReportWithProjectInfo;
function mongoFileAuthorReport(params, projectInfo, csvFilePath) {
    return _mongoFileAuthorReport(params, csvFilePath).pipe((0, operators_1.tap)((report) => (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath)), (0, operators_1.map)((report) => (0, mongo_report_1.cleanParamsForReport)(report)), (0, operators_1.map)((report) => (0, file_authors_report_1.addConsiderationsForFileAuthorsReport)(report)));
}
exports.mongoFileAuthorReport = mongoFileAuthorReport;
// exported only to allow the tests
// produce a report about authors that have contributed to files reading from a mongo db (previously loaded with files info)
function _mongoFileAuthorReport(params, csvFilePath) {
    const fileAuthor = (0, files_authors_query_1.fileAuthors)(params.connectionString, params.dbName, params.filesCollection, params.after);
    return (0, file_authors_report_1.fileAuthorsReportCore)(fileAuthor, params, csvFilePath);
}
exports._mongoFileAuthorReport = _mongoFileAuthorReport;
//# sourceMappingURL=mongo-file-author-report.js.map