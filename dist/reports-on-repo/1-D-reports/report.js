"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topChurnContributors = exports.filterMessage = exports.addConsideration = exports.addProjectInfoConsiderations = exports.addConsiderationsHeader = exports.Report = void 0;
class Report {
    constructor(_params, name, description) {
        this.date = { val: new Date(), description: `Date of the report run` };
        this.params = {
            description: `Parameters used to run the query that feeds the report`,
            val: { outDir: '' },
        };
        this.clocSummary = {
            description: `Summary of cloc run on the repor folder in csv format`,
            val: [],
        };
        this.totCommits = {
            description: `Total number of commits`,
            val: 0,
        };
        this.firstCommitDate = {
            description: `Date of the first commit`,
            val: new Date(),
        };
        this.lastCommitDate = {
            description: `Date of the last commit`,
            val: new Date(),
        };
        this.csvFile = {
            description: `Path to the csv file that contains the detailed data of the report`,
            val: '',
        };
        this.considerations = [];
        _params.outDir = _params.outDir ? _params.outDir : process.cwd();
        this.params.val = _params;
        this.name = name;
        this.description = description;
    }
    addConsiderations() {
        throw new Error('to be implemented');
    }
}
exports.Report = Report;
function addConsiderationsHeader(r) {
    addConsideration(r, `Report: ${r.description}`);
    addConsideration(r, `Run: ${r.date.val}`);
    addConsideration(r, `Parameters used:`);
    addConsideration(r, `${JSON.stringify(r.params.val)}`);
    if (r.csvFile) {
        addConsideration(r, `Report data saved in file ${r.csvFile.val}`);
    }
}
exports.addConsiderationsHeader = addConsiderationsHeader;
function addProjectInfoConsiderations(reports) {
    var _a;
    const r = reports[0];
    const generalProjectReport = new Report(r.params.val, `GENERAL PROJECT INFORMATION`, `GENERAL PROJECT INFORMATION`);
    addConsideration(generalProjectReport, `GENERAL PROJECT INFORMATION`);
    addConsideration(generalProjectReport, `Project folder: ${r.params.val.repoFolderPath}`);
    addConsideration(generalProjectReport, `cloc summary:`);
    (_a = r.clocSummary) === null || _a === void 0 ? void 0 : _a.val.forEach((csvLine) => addConsideration(generalProjectReport, clocLineAsTableRow(csvLine)));
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