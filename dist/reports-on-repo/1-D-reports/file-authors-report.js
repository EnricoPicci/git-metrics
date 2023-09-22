"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConsiderationsForFileAuthorsReport = exports.mapToCsvAndWriteFileAuthor = exports.fileAuthorsReportCore = exports.fileAuthorsReport = exports.projectAndFileAuthorsReport = exports.FileAuthorsReport = exports.FILE_AUTHORS_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const add_project_info_1 = require("./add-project-info");
const report_config_1 = require("./config/report-config");
const report_1 = require("./report");
const to_csv_1 = require("../../0-tools/csv/to-csv");
exports.FILE_AUTHORS_REPORT_NAME = 'FileAuthorsReport';
class FileAuthorsReport extends report_1.Report {
    constructor(_params) {
        super(_params, exports.FILE_AUTHORS_REPORT_NAME, `File-Authors report`);
        this.clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
        this.fewAutorsFiles = {
            val: [],
            description: `Files that have less or equal the number of authors set as minimun threshold in the report parameters`,
        };
        this.manyAutorsFiles = {
            val: [],
            description: `Files that have more or equal the number of authors set as maximum threshold in the report parameters`,
        };
    }
    addConsiderations() {
        return addConsiderationsForFileAuthorsReport(this);
    }
}
exports.FileAuthorsReport = FileAuthorsReport;
// API to be used if we want to generate the report for the general project as well as the report about file-authors
// reads also from the repo folder for information about the files currently in the project
function projectAndFileAuthorsReport(fileAuthors, projectInfo, params, csvFilePath) {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => fileAuthorsReport(fileAuthors, params, prjInfo, csvFilePath)));
}
exports.projectAndFileAuthorsReport = projectAndFileAuthorsReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
function fileAuthorsReport(fileCommits, params, projectInfo, csvFilePath) {
    return fileAuthorsReportCore(fileCommits, params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => addConsiderationsForFileAuthorsReport(report)));
}
exports.fileAuthorsReport = fileAuthorsReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of FileAuthors objects, like when we create the report from a Mongo query
function fileAuthorsReportCore(fileAuthor, params, csvFilePath = '') {
    const fileAuthorSource = fileAuthor.pipe((0, operators_1.share)());
    const generateReport = fileAuthorSource.pipe((0, operators_1.tap)((fileAuthors) => {
        console.log(`Processing ${fileAuthors.length} records to generate FileAuthorsReport`);
    }), _fileAuthorsReport(params), (0, operators_1.tap)((report) => (report.csvFile.val = csvFilePath)));
    const concurrentStreams = [
        generateReport,
    ];
    if (csvFilePath) {
        const writeCsv = fileAuthorSource.pipe(mapToCsvAndWriteFileAuthor(csvFilePath), (0, operators_1.map)(() => csvFilePath));
        concurrentStreams.push(writeCsv);
    }
    return (0, rxjs_1.forkJoin)(concurrentStreams).pipe((0, operators_1.tap)({
        next: ([, csvFile]) => console.log(`====>>>> FILE AUTHOR REPORT GENERATED -- data saved in ${csvFile}`),
    }), (0, operators_1.map)(([report]) => report));
}
exports.fileAuthorsReportCore = fileAuthorsReportCore;
function _fileAuthorsReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((filesAuthorsInfo) => {
        const r = new FileAuthorsReport(params);
        // set the default values in the params so that they are correctly reported in the report
        if (params.minNumberOfAuthorsThreshold === undefined) {
            params.minNumberOfAuthorsThreshold = report_config_1.REPORT_CONFIG.minNumberOfAuthorsThreshold;
        }
        if (params.maxNumberOfAuthorsThreshold === undefined) {
            params.maxNumberOfAuthorsThreshold = report_config_1.REPORT_CONFIG.maxNumberOfAuthorsThreshold;
        }
        const _minThr = params.minNumberOfAuthorsThreshold;
        const _maxThr = params.maxNumberOfAuthorsThreshold;
        const [fewAuthorsFiles, manyAuthorsFiles, clocTot] = filesAuthorsInfo.reduce(([_min, _max, _clocTot], file) => {
            _clocTot = _clocTot + file.cloc;
            if (file.authors <= _minThr) {
                _min.push(file);
            }
            if (file.authors > _maxThr) {
                _max.push(file);
            }
            return [_min, _max, _clocTot];
        }, [[], [], 0]);
        r.clocTot.val = clocTot;
        r.fewAutorsFiles.val = fewAuthorsFiles;
        r.manyAutorsFiles.val = manyAuthorsFiles;
        return r;
    }));
}
function mapToCsvAndWriteFileAuthor(csvFilePath) {
    return (0, rxjs_1.pipe)(mapFileAuthorToCsv(), (0, operators_1.toArray)(), (0, operators_1.concatMap)((lines) => (0, observable_fs_1.writeFileObs)(csvFilePath, lines)), (0, operators_1.tap)({
        next: (csvFile) => console.log(`====>>>> csv file for files-churn ${csvFile} created`),
    }));
}
exports.mapToCsvAndWriteFileAuthor = mapToCsvAndWriteFileAuthor;
function mapFileAuthorToCsv() {
    return (0, rxjs_1.pipe)((0, operators_1.concatMap)((fileAuthors) => {
        return fileAuthors.map((fileAuthor) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const _fileAuthor = Object.assign({}, fileAuthor);
            _fileAuthor.created = fileAuthor.created.toISOString();
            return _fileAuthor;
        });
    }), (0, to_csv_1.toCsvObs)());
}
function addConsiderationsForFileAuthorsReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    const fewAuthorsLoc = r.fewAutorsFiles.val.reduce((lines, file) => {
        lines = lines + file.cloc;
        return lines;
    }, 0);
    (0, report_1.addConsideration)(r, `${r.fewAutorsFiles.val.filter((f) => f.cloc).length} files (${fewAuthorsLoc} lines) have less than ${r.params.val['minNumberOfAuthorsThreshold']} authors in the period considered. This is equal to ${((fewAuthorsLoc / r.clocTot.val) * 100).toFixed(2)}% of the total lines in the project files which have changed in the period (${r.clocTot.val})`);
    const manyAuthorsLoc = r.manyAutorsFiles.val.reduce((lines, file) => {
        lines = lines + file.cloc;
        return lines;
    }, 0);
    (0, report_1.addConsideration)(r, `${r.manyAutorsFiles.val.filter((f) => f.cloc).length} files (${manyAuthorsLoc} lines) have more than ${r.params.val['maxNumberOfAuthorsThreshold']} authors in the period considered. This is equal to ${((manyAuthorsLoc / r.clocTot.val) * 100).toFixed(2)}% of the total lines in the project files which have changed in the period (${r.clocTot.val})`);
    return r;
}
exports.addConsiderationsForFileAuthorsReport = addConsiderationsForFileAuthorsReport;
//# sourceMappingURL=file-authors-report.js.map