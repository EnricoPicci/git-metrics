"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoProjectInfo = void 0;
const rxjs_1 = require("rxjs");
const all_commits_query_1 = require("../query/all-commits-query");
const cloc_functions_1 = require("../../../../cloc-functions/cloc.functions");
function mongoProjectCommitsInfo(params) {
    return (0, all_commits_query_1.commitsInfo)(params.connectionString, params.dbName, params.commitsCollection);
}
function mongoProjectInfo(params) {
    return mongoProjectCommitsInfo(params).pipe((0, rxjs_1.map)((commits) => ({ commits })), (0, rxjs_1.concatMap)((prjInfo) => (0, cloc_functions_1.clocSummaryCsvRaw$)(params.repoFolderPath).pipe((0, rxjs_1.map)((clocSummaryInfo) => (Object.assign({ clocSummaryInfo }, prjInfo))))), (0, rxjs_1.tap)({
        next: () => console.log(`====>>>> GENERAL PROJECT INFO CALCULATED including Mongo Info`),
    }));
}
exports.mongoProjectInfo = mongoProjectInfo;
//# sourceMappingURL=mongo-add-prj-info.js.map