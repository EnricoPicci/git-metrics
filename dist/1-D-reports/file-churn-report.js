"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topChurnContributorsAgeToString = exports.topChurnContributorsAge = exports.addConsiderationsForFileChurnReport = exports.mapFileChurnToCsv = exports.fileChurnReportCore = exports.fileChurnReport = exports.projectAndFileChurnReport = exports.FileChurnReport = exports.FILE_CHURN_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const add_project_info_1 = require("./add-project-info");
const report_config_1 = require("./config/report-config");
const report_1 = require("./report");
const to_csv_1 = require("../0-tools/csv/to-csv");
exports.FILE_CHURN_REPORT_NAME = 'FileChurnReport';
class FileChurnReport extends report_1.Report {
    constructor(_params) {
        super(_params);
        this.numFiles = { val: 0, description: `Number of files with churn` };
        this.clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
        this.totChurn = {
            val: 0,
            description: `Total number of lines added or deleted in the files selected for the period chosen`,
        };
        this.churn_vs_cloc = { val: 0, description: `Churn versus cloc` };
        this.topChurnedFiles = { val: [], description: `Files that show the highest churn` };
        this.topChurnContributors = {
            val: [],
            description: `Files that contribute to reach a certain percantage threshold`,
        };
        this.topChurnContributorsAge = {
            val: {},
            description: `Age distribution of files which contribute to the churn up to a certain threshold`,
        };
        this.name = exports.FILE_CHURN_REPORT_NAME;
        this.description = `File churn report`;
    }
}
exports.FileChurnReport = FileChurnReport;
// API to be used if we want to generate the report for the general project as well as the report about file churn
// reads also from the repo folder for information about the files currently in the project
function projectAndFileChurnReport(fileChurns, projectInfo, params, csvFilePath) {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => fileChurnReport(fileChurns, params, prjInfo, csvFilePath)));
}
exports.projectAndFileChurnReport = projectAndFileChurnReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
function fileChurnReport(fileChurns, params, projectInfo, csvFilePath) {
    return fileChurnReportCore(fileChurns, params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => addConsiderationsForFileChurnReport(report)));
}
exports.fileChurnReport = fileChurnReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of FileChurn objects, like when we create the report from a Mongo query
function fileChurnReportCore(fileChurns, params, csvFilePath) {
    const fileChurnSource = fileChurns.pipe((0, operators_1.toArray)(), (0, operators_1.tap)((fileChurns) => {
        console.log(`Processing ${fileChurns.length} records to generate FileChurnReport`);
    }), (0, operators_1.share)());
    const generateReport = fileChurnSource.pipe(_fileChurnReport(params));
    const concurrentStreams = [
        generateReport,
    ];
    if (csvFilePath) {
        const allChurns = fileChurnSource;
        concurrentStreams.push(allChurns);
        return (0, rxjs_1.forkJoin)(concurrentStreams).pipe((0, operators_1.concatMap)(([report, allFileChurns]) => {
            report.csvFile.val = csvFilePath;
            const csvLines = mapFileChurnToCsv(allFileChurns, report);
            return (0, observable_fs_1.writeFileObs)(csvFilePath, csvLines).pipe((0, operators_1.map)((csvFile) => [report, csvFile]));
        }), (0, operators_1.tap)({
            next: ([, csvFile]) => {
                console.log(`====>>>> FILE CHURN REPORT GENERATED -- data saved in ${csvFile}`);
            },
        }), (0, operators_1.map)(([report]) => report));
    }
    return generateReport.pipe((0, operators_1.tap)({
        next: () => {
            console.log(`====>>>> FILE CHURN REPORT GENERATED`);
        },
    }));
}
exports.fileChurnReportCore = fileChurnReportCore;
function _fileChurnReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((filesInfo) => {
        const r = filesInfo.reduce((_r, file) => {
            _r.clocTot.val = _r.clocTot.val + file.cloc;
            _r.numFiles.val++;
            _r.totChurn.val = _r.totChurn.val + file.linesAddDel;
            return _r;
        }, new FileChurnReport(params));
        // set the default values in the params so that they are correctly reported in the report
        if (params.topChurnFilesSize === undefined) {
            params.topChurnFilesSize = report_config_1.REPORT_CONFIG.defaultTopChurnFilesListSize;
        }
        if (params.percentThreshold === undefined) {
            params.percentThreshold = report_config_1.REPORT_CONFIG.defaultPercentageThreshold;
        }
        r.churn_vs_cloc.val = r.totChurn.val / r.clocTot.val;
        r.topChurnedFiles.val = filesInfo.slice(0, params.topChurnFilesSize);
        r.topChurnContributors.val = (0, report_1.topChurnContributors)(filesInfo, params.percentThreshold, r.totChurn.val);
        r.topChurnContributorsAge.val = topChurnContributorsAge(r.topChurnContributors.val);
        return r;
    }));
}
function mapFileChurnToCsv(fileChurns, report) {
    let cumulativeChurnPercentAccumulator = 0;
    let cumulativeNumberOfFilesPercentAccumulator = 0;
    const enrichedFileChurns = fileChurns.map((fileChurn, i) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _file = Object.assign({}, fileChurn);
        _file.created = fileChurn.created.toISOString();
        cumulativeChurnPercentAccumulator =
            cumulativeChurnPercentAccumulator + (fileChurn.linesAddDel / report.totChurn.val) * 100;
        _file.cumulativeChurnPercent = cumulativeChurnPercentAccumulator;
        cumulativeNumberOfFilesPercentAccumulator =
            cumulativeNumberOfFilesPercentAccumulator + (1 / report.numFiles.val) * 100;
        _file.cumulativeNumberOfFilesPercent = cumulativeNumberOfFilesPercentAccumulator;
        _file.churnRanking = i + 1;
        return _file;
    });
    return (0, to_csv_1.toCsv)(enrichedFileChurns);
}
exports.mapFileChurnToCsv = mapFileChurnToCsv;
function addConsiderationsForFileChurnReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    (0, report_1.addConsideration)(r, `${r.numFiles.val} files have been changed in the period considered.`);
    (0, report_1.addConsideration)(r, `The files which have been changed in the period currently contain ${r.clocTot.val} lines in the project folder ${(0, report_1.filterMessage)(r.params.val.filter)}.`);
    (0, report_1.addConsideration)(r, `The total churn, measured as total number of lines added or removed in the period considered, is ${r.totChurn.val}.`);
    (0, report_1.addConsideration)(r, `The total churn in the period considered (${r.totChurn.val}) is ${r.churn_vs_cloc.val.toFixed(2)} times the current number of lines of code (${r.clocTot.val}).`);
    (0, report_1.addConsideration)(r, `${((r.topChurnContributors.val.length / r.numFiles.val) * 100).toFixed(2)}% of files contribute to ${r.params.val['percentThreshold']}% of churn`);
    (0, report_1.addConsideration)(r, `The age of the files that contribute most to the churn is [ ${topChurnContributorsAgeToString(r.topChurnContributorsAge.val)} ]`);
    return r;
}
exports.addConsiderationsForFileChurnReport = addConsiderationsForFileChurnReport;
// calculate the age of the files that contribute to reach a certain threshold of churn
function topChurnContributorsAge(topContributors) {
    return topContributors.reduce((acc, val) => {
        const year = val.created.getFullYear().toString();
        acc[year] = acc[year] ? [...acc[year], val] : [val];
        return acc;
    }, {});
}
exports.topChurnContributorsAge = topChurnContributorsAge;
function topChurnContributorsAgeToString(topContributors) {
    return Object.entries(topContributors).reduce((acc, val) => {
        acc = `${acc}${val[0]}: ${Object.keys(val[1]).length} -- `;
        return acc;
    }, '');
}
exports.topChurnContributorsAgeToString = topChurnContributorsAgeToString;
//# sourceMappingURL=file-churn-report.js.map