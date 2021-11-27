"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topChurnContributors = exports.filterMessage = exports.addConsideration = exports.addProjectInfoConsiderations = exports.addConsiderationsHeader = exports.Report = void 0;
class Report {
    constructor(_params) {
        this.date = { val: new Date(), description: `Date of the report run` };
        this.params = {
            description: `Parameters used to run the query that feeds the report`,
        };
        this.clocSummary = {
            description: `Summary of cloc run on the repor folder in csv format`,
        };
        this.totCommits = {
            description: `Total number of commits`,
        };
        this.firstCommitDate = {
            description: `Date of the first commit`,
        };
        this.lastCommitDate = {
            description: `Date of the last commit`,
        };
        this.csvFile = {
            description: `Path to the csv file that contains the detailed data of the report`,
        };
        this.considerations = [];
        _params.outDir = _params.outDir ? _params.outDir : process.cwd();
        this.params.val = _params;
    }
}
exports.Report = Report;
function addConsiderationsHeader(r) {
    addConsideration(r, `Report: ${r.description}`);
    addConsideration(r, `Run: ${r.date.val}`);
    addConsideration(r, `Parameters used:`);
    addConsideration(r, `${JSON.stringify(r.params.val)}`);
    addConsideration(r, `Report data saved in file ${r.csvFile.val}`);
}
exports.addConsiderationsHeader = addConsiderationsHeader;
function addProjectInfoConsiderations(reports) {
    const r = reports[0];
    const generalProjectReport = new Report(r.params.val);
    addConsideration(generalProjectReport, `GENERAL PROJECT INFORMATION`);
    addConsideration(generalProjectReport, `Project folder: ${r.params.val.repoFolderPath}`);
    addConsideration(generalProjectReport, `cloc summary:`);
    r.clocSummary.val.forEach((csvLine) => addConsideration(generalProjectReport, clocLineAsTableRow(csvLine)));
    addConsideration(generalProjectReport, `Number of commits: ${r.totCommits.val}`);
    addConsideration(generalProjectReport, `First commit: ${r.firstCommitDate.val}`);
    addConsideration(generalProjectReport, `Last commit: ${r.lastCommitDate.val}`);
    return [generalProjectReport, ...reports];
}
exports.addProjectInfoConsiderations = addProjectInfoConsiderations;
function addConsideration(r, consideration) {
    r.considerations.push(consideration);
}
exports.addConsideration = addConsideration;
function filterMessage(filter) {
    return filter ? `(filtered for "${filter.join(' ')}")` : '';
}
exports.filterMessage = filterMessage;
// calculate the number of files or authors that contribute to reach a certain threshold of churn
// assumes that the array of churnInfo is ordered in decreasing order for the 'linesAddDel' property
function topChurnContributors(churnInfo, threshold, totChurn) {
    let _accumulatedChurn = 0;
    const contributors = [];
    for (let i = 0; _accumulatedChurn / totChurn < threshold / 100; i++) {
        _accumulatedChurn = _accumulatedChurn + churnInfo[i].linesAddDel;
        contributors.push(churnInfo[i]);
    }
    return contributors;
}
exports.topChurnContributors = topChurnContributors;
function clocLineAsTableRow(csvLine) {
    return csvLine.split(',').join('\t');
}
//# sourceMappingURL=report.js.map