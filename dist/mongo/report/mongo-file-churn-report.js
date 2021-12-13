"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._mongoFileChurnReport = exports.mongoFileChurnReport = exports.mongoFileChurnReportWithProjectInfo = void 0;
const operators_1 = require("rxjs/operators");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const file_churn_query_1 = require("../query/file-churn-query");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const mongo_report_1 = require("./mongo-report");
// produce a report about file churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
function mongoFileChurnReportWithProjectInfo(params, csvFilePath) {
    return (0, mongo_add_prj_info_1.mongoProjectInfo)(params).pipe((0, operators_1.concatMap)((prjInfo) => mongoFileChurnReport(params, prjInfo, csvFilePath)));
}
exports.mongoFileChurnReportWithProjectInfo = mongoFileChurnReportWithProjectInfo;
function mongoFileChurnReport(params, projectInfo, csvFilePath) {
    return _mongoFileChurnReport(params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => (0, mongo_report_1.cleanParamsForReport)(report)), (0, operators_1.map)((report) => (0, file_churn_report_1.addConsiderationsForFileChurnReport)(report)));
}
exports.mongoFileChurnReport = mongoFileChurnReport;
// exported only to allow the tests
// produce a report about file churn reading from a mongo db (previously loaded with files info)
function _mongoFileChurnReport(params, csvFilePath) {
    const fileChurnSource = (0, file_churn_query_1.fileChurn)(params.connectionString, params.dbName, params.filesCollection, params.after).pipe((0, operators_1.toArray)());
    return (0, file_churn_report_1.fileChurnReportCore)(fileChurnSource, params, csvFilePath);
}
exports._mongoFileChurnReport = _mongoFileChurnReport;
//# sourceMappingURL=mongo-file-churn-report.js.map