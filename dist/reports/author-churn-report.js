"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConsiderationsForAuthorChurnReport = exports.mapToCsvAndWriteAuthorChurn = exports.authorChurnReportCore = exports.authorChurnReport = exports.projectAndAuthorChurnReport = exports.AuthorChurnReport = exports.AUTHOR_CHURN_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const report_1 = require("./report");
const report_config_1 = require("./config/report-config");
const add_project_info_1 = require("./add-project-info");
const to_csv_1 = require("../tools/csv/to-csv");
exports.AUTHOR_CHURN_REPORT_NAME = 'AuthorChurnReport';
class AuthorChurnReport extends report_1.Report {
    constructor(_params) {
        super(_params);
        this.numAuthors = { val: 0, description: `Number of authors who have contributed to the churn authoring some files` };
        this.totChurn = {
            val: 0,
            description: `Total number of lines added or deleted in the files selected for the period chosen`,
        };
        this.topAuthors = { val: [], description: `Authors who hove contributed most to the churn` };
        this.topAuthorChurnContributors = {
            val: [],
            description: `Authors who contribute to reach a certain percantage threshold`,
        };
        this.name = exports.AUTHOR_CHURN_REPORT_NAME;
        this.description = `Author churn report`;
    }
}
exports.AuthorChurnReport = AuthorChurnReport;
// API to be used if we want to generate the report for the general project as well as the report about author churn
// reads also from the repo folder for information about the files currently in the project
function projectAndAuthorChurnReport(authorChurns, projectInfo, params, csvFilePath) {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => authorChurnReport(authorChurns, params, prjInfo, csvFilePath)));
}
exports.projectAndAuthorChurnReport = projectAndAuthorChurnReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
function authorChurnReport(authorChurns, params, projectInfo, csvFilePath) {
    return authorChurnReportCore(authorChurns, params, csvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => addConsiderationsForAuthorChurnReport(report)));
}
exports.authorChurnReport = authorChurnReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of AuthorChurn objects, like when we create the report from a Mongo query
function authorChurnReportCore(authorChurns, params, csvFilePath) {
    const authorChurnsSource = authorChurns.pipe((0, operators_1.share)());
    const generateReport = authorChurnsSource.pipe((0, operators_1.toArray)(), _authorChurnReport(params));
    const concurrentStreams = [
        generateReport,
    ];
    if (csvFilePath) {
        const writeCsv = authorChurnsSource.pipe(mapToCsvAndWriteAuthorChurn(csvFilePath), (0, operators_1.map)(() => csvFilePath));
        concurrentStreams.push(writeCsv);
    }
    return (0, rxjs_1.forkJoin)(concurrentStreams).pipe((0, operators_1.tap)({
        next: ([, csvFile]) => console.log(`====>>>> AUTHOR CHURN REPORT GENERATED -- data saved in ${csvFile}`),
    }), (0, operators_1.map)(([report]) => report));
}
exports.authorChurnReportCore = authorChurnReportCore;
function _authorChurnReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((authorsInfo) => {
        const r = authorsInfo.reduce((_r, author) => {
            _r.numAuthors.val++;
            _r.totChurn.val = _r.totChurn.val + author.linesAddDel;
            return _r;
        }, new AuthorChurnReport(params));
        // set the default values in the params so that they are correctly reported in the report
        if (params.numberOfTopChurnAuthors === undefined) {
            params.numberOfTopChurnAuthors = report_config_1.REPORT_CONFIG.defaultTopChurnAuthorsListSize;
        }
        if (params.percentThreshold === undefined) {
            params.percentThreshold = report_config_1.REPORT_CONFIG.defaultPercentageThreshold;
        }
        r.topAuthors.val = authorsInfo.slice(0, params.numberOfTopChurnAuthors);
        r.topAuthorChurnContributors.val = (0, report_1.topChurnContributors)(authorsInfo, params.percentThreshold, r.totChurn.val);
        return r;
    }));
}
function mapToCsvAndWriteAuthorChurn(csvFilePath) {
    return (0, rxjs_1.pipe)(mapAuthorsChurnToCsv(), (0, operators_1.toArray)(), (0, operators_1.concatMap)((lines) => (0, observable_fs_1.writeFileObs)(csvFilePath, lines)), (0, operators_1.tap)({
        next: (csvFile) => console.log(`====>>>> csv file for files-churn ${csvFile} created`),
    }));
}
exports.mapToCsvAndWriteAuthorChurn = mapToCsvAndWriteAuthorChurn;
function mapAuthorsChurnToCsv() {
    return (0, rxjs_1.pipe)((0, operators_1.map)((author) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _author = Object.assign({}, author);
        _author.firstCommit = _author.firstCommit.toISOString();
        _author.lastCommit = _author.lastCommit.toISOString();
        return _author;
    }), (0, to_csv_1.toCsvObs)());
}
function addConsiderationsForAuthorChurnReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    (0, report_1.addConsideration)(r, `-- ${r.numAuthors.val} authors have contributed to the project in the period considered.`);
    (0, report_1.addConsideration)(r, `The total churn, measured as total number of lines added or removed in the period considered, is ${r.totChurn.val}.`);
    (0, report_1.addConsideration)(r, `The authors who have contributed most are ${r.topAuthors.val.map((a) => a.authorName)}.`);
    (0, report_1.addConsideration)(r, `-- ${r.topAuthorChurnContributors.val.length} authors who have contributed for more than ${r.params.val['percentThreshold']}% of churn.`);
    return r;
}
exports.addConsiderationsForAuthorChurnReport = addConsiderationsForAuthorChurnReport;
//# sourceMappingURL=author-churn-report.js.map