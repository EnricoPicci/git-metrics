"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConsiderationsForFilesCouplingReport = exports.fileCouplingReportCore = exports.filesCouplingReport = exports.projectAndFileCouplingReport = exports.FilesCouplingReport = exports.FILES_COUPLING_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const add_project_info_1 = require("./add-project-info");
const report_1 = require("./report");
const to_csv_1 = require("../../../tools/csv/to-csv");
exports.FILES_COUPLING_NAME = 'FilesCouplingReport';
class FilesCouplingReport extends report_1.Report {
    constructor(_params) {
        super(_params, exports.FILES_COUPLING_NAME, `File coupling report`);
        this.maxCouplings = {
            val: [],
            description: `Files whith an high number of commits potentially coupled`,
        };
    }
    addConsiderations() {
        return addConsiderationsForFilesCouplingReport(this);
    }
}
exports.FilesCouplingReport = FilesCouplingReport;
// API to be used if we want to generate the report for the general project as well as the report about file churn
// reads also from the repo folder for information about the files currently in the project
function projectAndFileCouplingReport(fileCoupling, projectInfo, params, csvFilePath = '') {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => filesCouplingReport(fileCoupling, params, prjInfo, csvFilePath)));
}
exports.projectAndFileCouplingReport = projectAndFileCouplingReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of GitCommit
function filesCouplingReport(fileCoupling, params, projectInfo, csvFilePath) {
    return fileCouplingReportCore(fileCoupling, params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => addConsiderationsForFilesCouplingReport(report)));
}
exports.filesCouplingReport = filesCouplingReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of GitCommit objects, like when we create the report from a Mongo query
function fileCouplingReportCore(fileCoupling, params, csvFilePath = '') {
    const fileCouplingSource = fileCoupling.pipe((0, operators_1.tap)((fileCouplings) => {
        console.log(`Processing ${fileCouplings.length} records to generate FileCouplingReport`);
    }), (0, operators_1.share)());
    const generateReport = fileCouplingSource.pipe(_fileCouplingReport(params), (0, operators_1.tap)((report) => (report.csvFile.val = csvFilePath)));
    const concurrentStreams = [generateReport];
    if (csvFilePath) {
        concurrentStreams.push(fileCouplingSource);
        return (0, rxjs_1.forkJoin)(concurrentStreams).pipe((0, operators_1.concatMap)(([report, _allFileCouplings]) => {
            const allFileCouplings = _allFileCouplings;
            report.csvFile.val = csvFilePath;
            if (allFileCouplings.length === 0) {
                console.log('!!!!!!!! no data on file couplings');
            }
            const csvLines = (0, to_csv_1.toCsv)(allFileCouplings);
            return (0, observable_fs_1.writeFileObs)(csvFilePath, csvLines).pipe((0, operators_1.map)((csvFile) => [report, csvFile]));
        }), (0, operators_1.tap)({
            next: ([report, csvFile]) => {
                console.log(``);
                console.log(`====>>>> FILES COUPLING REPORT GENERATED -- data saved in ${csvFile}`);
                report.csvFile.val = csvFile;
            },
        }), (0, operators_1.map)(([report]) => report));
    }
    return generateReport.pipe((0, operators_1.tap)({
        next: () => {
            console.log(`====>>>> FILES COUPLING REPORT GENERATED`);
        },
    }));
}
exports.fileCouplingReportCore = fileCouplingReportCore;
function _fileCouplingReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((listOfCouplings) => {
        const report = new FilesCouplingReport(params);
        report.maxCouplings.val = listOfCouplings.slice(0, 5);
        return report;
    }));
}
function addConsiderationsForFilesCouplingReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    const mostCoupledFile = r.maxCouplings.val.length > 0 ? r.maxCouplings.val[0] : null;
    if (mostCoupledFile) {
        const howManyTimesPercentage = mostCoupledFile.howManyTimes_vs_totCommits;
        const coupledWith = mostCoupledFile.path;
        (0, report_1.addConsideration)(r, `It seems that ${howManyTimesPercentage}% of the times file ${mostCoupledFile.coupledFile} is committed also file ${coupledWith} is committed.`);
    }
    if (r.csvFile.val) {
        (0, report_1.addConsideration)(r, `The files coupling info have been saved in the file ${r.csvFile.val}.`);
    }
    return r;
}
exports.addConsiderationsForFilesCouplingReport = addConsiderationsForFilesCouplingReport;
//# sourceMappingURL=file-coupling-report.js.map