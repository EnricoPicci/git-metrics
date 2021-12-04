"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._mongoFilesCouplingReport = exports.mongoFilesCouplingReport = exports.mongoFilesCouplingReportWithProjectInfo = void 0;
const operators_1 = require("rxjs/operators");
const file_coupling_report_1 = require("../../1-D-reports/file-coupling-report");
const commits_query_1 = require("../query/commits-query");
const mongo_add_prj_info_1 = require("./mongo-add-prj-info");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const mongo_report_1 = require("./mongo-report");
const file_coupling_aggregate_1 = require("../../1-C-aggregate-in-memory/file-coupling-aggregate");
// produce a report about files coupling and general project info reading from a mongo db (previously loaded with commit info)
// reads also from the repo folder for information about the files currently in the project
function mongoFilesCouplingReportWithProjectInfo(params, csvFilePath) {
    return (0, mongo_add_prj_info_1.mongoProjectInfo)(params).pipe((0, operators_1.concatMap)((prjInfo) => mongoFilesCouplingReport(params, prjInfo, csvFilePath)));
}
exports.mongoFilesCouplingReportWithProjectInfo = mongoFilesCouplingReportWithProjectInfo;
function mongoFilesCouplingReport(params, projectInfo, csvFilePath) {
    return _mongoFilesCouplingReport(params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => (0, mongo_report_1.cleanParamsForReport)(report)), (0, operators_1.map)((report) => (0, file_coupling_report_1.addConsiderationsForFilesCouplingReport)(report)));
}
exports.mongoFilesCouplingReport = mongoFilesCouplingReport;
// exported only to allow the tests
// produce a report about files coupling reading from a mongo db (previously loaded info)
// if csvFilesChurnFilePath is specified, is the path of the file where the data coming from the files collection query is saved
function _mongoFilesCouplingReport(params, csvFilePath) {
    const commitsSource = (0, commits_query_1.commits)(params.connectionString, params.dbName, params.commitsCollection, params.after);
    const couplingsStream = (0, file_coupling_aggregate_1.fileCoupling)(commitsSource, 10, params.after);
    return (0, file_coupling_report_1.fileCouplingReportCore)(couplingsStream, params, csvFilePath);
}
exports._mongoFilesCouplingReport = _mongoFilesCouplingReport;
//# sourceMappingURL=mongo-files-coupling-report.js.map