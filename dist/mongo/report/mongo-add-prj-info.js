"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoProjectInfo = void 0;
const rxjs_1 = require("rxjs");
const all_commits_query_1 = require("../query/all-commits-query");
const cloc_1 = require("../../1-A-read/cloc");
function mongoProjectCommitsInfo(params) {
    return (0, all_commits_query_1.commitsInfo)(params.connectionString, params.dbName, params.commitsCollection);
}
function mongoProjectInfo(params) {
    return mongoProjectCommitsInfo(params).pipe((0, rxjs_1.map)((commits) => ({ commits })), (0, rxjs_1.concatMap)((prjInfo) => (0, cloc_1.clocSummaryInfo)(params.repoFolderPath, params.outDir, params.clocDefsPath).pipe((0, rxjs_1.map)((clocSummaryInfo) => (Object.assign({ clocSummaryInfo }, prjInfo))))), (0, rxjs_1.tap)({
        next: () => console.log(`====>>>> GENERAL PROJECT INFO CALCULATED including Mongo Info`),
    }));
}
exports.mongoProjectInfo = mongoProjectInfo;
//# sourceMappingURL=mongo-add-prj-info.js.map