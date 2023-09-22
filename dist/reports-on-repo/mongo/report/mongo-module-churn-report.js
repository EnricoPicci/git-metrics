"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._mongoModuleChurnReport = exports.mongoModuleChurnReport = exports.mongoModuleChurnReportWithProjectInfo = void 0;
const operators_1 = require("rxjs/operators");
const module_churn_report_1 = require("../../1-D-reports/module-churn-report");
const file_churn_query_1 = require("../query/file-churn-query");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const mongo_report_1 = require("./mongo-report");
const module_churn_aggregate_1 = require("../../1-C-aggregate-in-memory/module-churn-aggregate");
// produce a report about module churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
function mongoModuleChurnReportWithProjectInfo(params, csvFilePrefix) {
    return (0, mongo_add_prj_info_1.mongoProjectInfo)(params).pipe((0, operators_1.concatMap)((prjInfo) => {
        return mongoModuleChurnReport(params, prjInfo, csvFilePrefix);
    }));
}
exports.mongoModuleChurnReportWithProjectInfo = mongoModuleChurnReportWithProjectInfo;
function mongoModuleChurnReport(
// this report uses the same parameters for the query to monfo as the file churn report
params, projectInfo, csvFilePrefix) {
    return _mongoModuleChurnReport(params, csvFilePrefix).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, report.csvFile.val);
    }), (0, operators_1.map)((report) => report), (0, operators_1.map)((report) => (0, mongo_report_1.cleanParamsForReport)(report)), (0, operators_1.map)((report) => (0, module_churn_report_1.addConsiderationsForModuleChurnReport)(report)));
}
exports.mongoModuleChurnReport = mongoModuleChurnReport;
// exported only to allow the tests
// produce a report about module churn reading from a mongo db (previously loaded with files info)
// if csvFilePath is specified, is the path of the file where the data coming from the files collection query is saved
function _mongoModuleChurnReport(params, csvFilePath) {
    const fileChurnSource = (0, file_churn_query_1.fileChurn)(params.connectionString, params.dbName, params.filesCollection, params.after).pipe((0, operators_1.toArray)(), (0, operators_1.share)());
    const moduleChurnsStream = (0, module_churn_aggregate_1.moduleChurns)(fileChurnSource);
    return (0, module_churn_report_1.moduleChurnReportCore)(moduleChurnsStream, params, csvFilePath);
}
exports._mongoModuleChurnReport = _mongoModuleChurnReport;
//# sourceMappingURL=mongo-module-churn-report.js.map