"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._mongoAuthorChurnReport = exports.mongoAuthorChurnReport = exports.mongoAuthorChurnReportWithProjectInfo = void 0;
const operators_1 = require("rxjs/operators");
const author_churn_report_1 = require("../../1-D-reports/author-churn-report");
const author_churn_query_1 = require("../query/author-churn-query");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const mongo_report_1 = require("./mongo-report");
// produce a report about author churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
function mongoAuthorChurnReportWithProjectInfo(params, csvFilePath) {
    return (0, mongo_add_prj_info_1.mongoProjectInfo)(params).pipe((0, operators_1.concatMap)((prjInfo) => mongoAuthorChurnReport(params, prjInfo, csvFilePath)));
}
exports.mongoAuthorChurnReportWithProjectInfo = mongoAuthorChurnReportWithProjectInfo;
function mongoAuthorChurnReport(params, projectInfo, csvFilePath) {
    return _mongoAuthorChurnReport(params, csvFilePath).pipe((0, operators_1.tap)((report) => (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath)), (0, operators_1.map)((report) => (0, mongo_report_1.cleanParamsForReport)(report)), (0, operators_1.map)((report) => (0, author_churn_report_1.addConsiderationsForAuthorChurnReport)(report)));
}
exports.mongoAuthorChurnReport = mongoAuthorChurnReport;
// exported only to allow the tests
// produce a report about author churn reading from a mongo db (previously loaded with files info)
function _mongoAuthorChurnReport(params, csvFilePath) {
    const authorChurnSource = (0, author_churn_query_1.authorChurn)(params.connectionString, params.dbName, params.filesCollection, params.commitsCollection, params.after).pipe((0, operators_1.share)());
    return (0, author_churn_report_1.authorChurnReportCore)(authorChurnSource, params, csvFilePath);
}
exports._mongoAuthorChurnReport = _mongoAuthorChurnReport;
//# sourceMappingURL=mongo-author-churn-report.js.map