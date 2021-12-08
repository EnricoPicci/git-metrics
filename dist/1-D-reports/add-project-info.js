"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProjectInfo = void 0;
function addProjectInfo(report, prjInfo, csvFilePath) {
    report.clocSummary.val = prjInfo.clocSummaryInfo;
    report.totCommits.val = prjInfo.commits.count;
    report.firstCommitDate.val = prjInfo.commits.first.committerDate;
    report.lastCommitDate.val = prjInfo.commits.last.committerDate;
    if (csvFilePath) {
        report.csvFile.val = csvFilePath;
    }
    console.log(`====>>>> GENERAL PROJECT INFO ADDED TO REPORT ${report.description}`);
}
exports.addProjectInfo = addProjectInfo;
//# sourceMappingURL=add-project-info.js.map