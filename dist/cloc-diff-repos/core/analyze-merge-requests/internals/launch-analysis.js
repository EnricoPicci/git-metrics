"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchMergRequestAnalysisInternal = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const xlsx_1 = __importDefault(require("xlsx"));
const group_functions_1 = require("../../../internals/gitlab-functions/group.functions");
const analyze_merge_requests_1 = require("./analyze-merge-requests");
const to_excel_1 = require("./to-excel");
function launchMergRequestAnalysisInternal(gitLabUrl, token, groupId, outdir) {
    let _name;
    return (0, group_functions_1.readGroup)(gitLabUrl, token, groupId).pipe((0, rxjs_1.concatMap)(group => {
        _name = group.name;
        return (0, analyze_merge_requests_1.runMergeRequestAnalysis)(gitLabUrl, token, groupId);
    }), (0, rxjs_1.map)(analysis => {
        return (0, to_excel_1.analysisToExcel)(analysis);
    }), (0, rxjs_1.tap)((workbook) => {
        const fileName = path_1.default.join(outdir, `${_name}.xls`);
        xlsx_1.default.writeFile(workbook, fileName);
        console.log(`====>>>> Workbook written ${fileName}`);
    }));
}
exports.launchMergRequestAnalysisInternal = launchMergRequestAnalysisInternal;
//# sourceMappingURL=launch-analysis.js.map