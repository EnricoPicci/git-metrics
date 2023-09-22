"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisToExcel = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
function analysisToExcel(mergeRequestAnalysis) {
    const workbook = xlsx_1.default.utils.book_new();
    addSummarySheet(workbook, mergeRequestAnalysis.summary);
    addSummaryStatsByMonthSheet(workbook, mergeRequestAnalysis.summaryStatsByMonth);
    addSummaryStatsByAuthorSheet(workbook, mergeRequestAnalysis.summaryStatsByAuthor);
    addSummaryStatsByNumOfDaysSheet(workbook, mergeRequestAnalysis.summaryStatsByNumDays);
    addMergeRequestsSheet(workbook, "All Merge Requests", mergeRequestAnalysis.mergeRequestsCompact);
    addMergeRequestsSheet(workbook, "Bug Fixes", mergeRequestAnalysis.bugFixes);
    addMergeRequestsSheet(workbook, "Features", mergeRequestAnalysis.features);
    addByMonthSheet(workbook, "MR Created By Month", mergeRequestAnalysis.createdByMonth);
    addByMonthSheet(workbook, "MR Merged By Month", mergeRequestAnalysis.mergedByMonth);
    addByMonthSheet(workbook, "MR Closed By Month", mergeRequestAnalysis.closedByMonth);
    addByNumOfDaysSheet(workbook, "MR By Num Of Days To Merge", mergeRequestAnalysis.byNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "MR By Num Of Days To Close", mergeRequestAnalysis.byNumOfDaysToClose);
    addByMonthSheet(workbook, "Fix Created By Month", mergeRequestAnalysis.bugFixesCreatedByMonth);
    addByMonthSheet(workbook, "Fix Merged By Month", mergeRequestAnalysis.bugFixesMergedByMonth);
    addByMonthSheet(workbook, "Fix Closed By Month", mergeRequestAnalysis.bugFixesClosedByMonth);
    addByNumOfDaysSheet(workbook, "Fix By Num Of Days To Merge", mergeRequestAnalysis.bugFixesByNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "Fix By Num Of Days To Close", mergeRequestAnalysis.bugFixesByNumOfDaysToClose);
    addByMonthSheet(workbook, "Feat Created By Month", mergeRequestAnalysis.featuresCreatedByMonth);
    addByMonthSheet(workbook, "Feat Merged By Month", mergeRequestAnalysis.featuresMergedByMonth);
    addByMonthSheet(workbook, "Feat Closed By Month", mergeRequestAnalysis.featuresClosedByMonth);
    addByNumOfDaysSheet(workbook, "Feat By Num Of Days To Merge", mergeRequestAnalysis.featuresByNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "Feat By Num Of Days To Close", mergeRequestAnalysis.featuresByNumOfDaysToClose);
    return workbook;
}
exports.analysisToExcel = analysisToExcel;
function addSummarySheet(workbook, summary) {
    const sheet = xlsx_1.default.utils.json_to_sheet([summary]);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, 'Summary');
}
function addSummaryStatsByMonthSheet(workbook, dataMap) {
    const data = Array.from(dataMap.entries()).map(([month, stats]) => {
        return Object.assign({ year_month: month }, stats);
    });
    const sheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, 'Summary Stats By Month');
}
function addSummaryStatsByAuthorSheet(workbook, dataMap) {
    const data = Array.from(dataMap.entries()).map(([author, numOfMergeRequestsCreated]) => {
        return {
            author,
            numOfMergeRequestsCreated,
        };
    });
    const sheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, 'Summary Stats By Auhtor');
}
function addSummaryStatsByNumOfDaysSheet(workbook, summaries) {
    Object.entries(summaries).forEach(([summaryName, summary]) => {
        const data = Array.from(summary.entries()).map(([num_of_days, numOfMergeRequests]) => {
            return {
                num_of_days: num_of_days,
                numOfMergeRequests,
            };
        });
        const sheet = xlsx_1.default.utils.json_to_sheet(data);
        xlsx_1.default.utils.book_append_sheet(workbook, sheet, summaryName.slice(0, 30));
    });
}
function addMergeRequestsSheet(workbook, sheetName, data) {
    const sheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, sheetName);
}
function addByMonthSheet(workbook, sheetName, dataMap) {
    let data = [];
    Array.from(dataMap.entries()).forEach(([month, mergeRequests]) => {
        data.push(...mergeRequests.map(mergeRequest => {
            return Object.assign({ year_month: month }, mergeRequest);
        }));
    });
    const sheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, sheetName);
}
function addByNumOfDaysSheet(workbook, sheetName, dataMap) {
    let data = [];
    Array.from(dataMap.entries()).forEach(([numDays, mergeRequests]) => {
        data.push(...mergeRequests.map(mergeRequest => {
            return Object.assign({ num_of_days: numDays }, mergeRequest);
        }));
    });
    const sheet = xlsx_1.default.utils.json_to_sheet(data);
    xlsx_1.default.utils.book_append_sheet(workbook, sheet, sheetName);
}
//# sourceMappingURL=to-excel.js.map