"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConsiderationsForModuleChurnReport = exports._moduleChurnReport = exports.moduleChurnReportCore = exports.moduleChurnReport = exports.projectAndModuleChurnReport = exports.ModuleChurnReport = exports.MODULE_CHURN_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const report_config_1 = require("./config/report-config");
const report_1 = require("./report");
const add_project_info_1 = require("./add-project-info");
const to_csv_1 = require("../../../tools/csv/to-csv");
const split_path_1 = require("../../../tools/split-path/split-path");
exports.MODULE_CHURN_REPORT_NAME = 'ModuleChurnReport';
class ModuleChurnReport extends report_1.Report {
    constructor(_params) {
        super(_params, exports.MODULE_CHURN_REPORT_NAME, `Module churn report`);
        this.numChurnedFiles = { val: 0, description: `Number of files with churn` };
        this.numModules = { val: 0, description: `Total number of modules` };
        this.numChangedModules = { val: 0, description: `Number of modules with churn` };
        this.maxModuleDepth = { val: 0, description: `Max number of folders in the path of the modules` };
        this.clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
        this.totChurn = {
            val: 0,
            description: `Total number of lines added or deleted in the files selected for the period chosen`,
        };
        this.churn_vs_cloc = { val: 0, description: `Churn versus cloc` };
        this.topChurnedModules = { val: [], description: `Modules that show the highest churn` };
    }
    addConsiderations() {
        return addConsiderationsForModuleChurnReport(this);
    }
}
exports.ModuleChurnReport = ModuleChurnReport;
// API to be used if we want to generate the report for the general project as well as the report about module churn
// reads also from the repo folder for information about the files currently in the project
function projectAndModuleChurnReport(moduleChurns, projectInfo, params, csvFilePrefix) {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => moduleChurnReport(moduleChurns, params, prjInfo, csvFilePrefix)));
}
exports.projectAndModuleChurnReport = projectAndModuleChurnReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of ModuleChurn objects
function moduleChurnReport(moduleChurns, params, projectInfo, csvFilePrefix) {
    return moduleChurnReportCore(moduleChurns, params, csvFilePrefix).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, report.csvFile.val);
    }), (0, operators_1.map)((report) => addConsiderationsForModuleChurnReport(report)));
}
exports.moduleChurnReport = moduleChurnReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of ModuleChurn objects, like when we create the report from a Mongo query
function moduleChurnReportCore(moduleChurns, params, csvFilePath) {
    const moduleChurnSource = moduleChurns.pipe((0, operators_1.map)((churns) => {
        if (churns.length < 1) {
            return { churns, maxDepth: 0 };
        }
        const churnsSorted = churns.sort((a, b) => (0, split_path_1.splitPath)(b.path).length - (0, split_path_1.splitPath)(a.path).length);
        const maxDepth = (0, split_path_1.splitPath)(churnsSorted[0].path).length;
        return { churns, maxDepth };
    }), (0, operators_1.tap)((moduleChurns) => {
        console.log(`Processing ${moduleChurns.churns.length} records to generate ModuleChurnReport`);
    }), (0, operators_1.share)());
    const generateReport = moduleChurnSource.pipe(_moduleChurnReport(params));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let concurrentStreams = [generateReport];
    if (csvFilePath) {
        const _concurrentStreams = [concurrentStreams[0], moduleChurnSource];
        return (0, rxjs_1.forkJoin)(_concurrentStreams).pipe((0, operators_1.concatMap)(([report, { churns, maxDepth }]) => {
            const churnsEnriched = churns.map((c) => enrichForCsv(c, maxDepth));
            if (churnsEnriched.length === 0) {
                console.log('!!!!!!!! no data on file churns to calculate module churns');
            }
            const csvLines = (0, to_csv_1.toCsv)(churnsEnriched);
            report.csvFile.val = csvFilePath;
            return (0, observable_fs_1.writeFileObs)(csvFilePath, csvLines).pipe((0, operators_1.map)((csvFile) => [report, csvFile]));
        }), (0, operators_1.tap)({
            next: ([report, csvFile]) => {
                console.log(`====>>>> MODULE CHURN REPORT GENERATED -- data saved in ${csvFile}`);
                report.csvFile.val = csvFile;
            },
        }), (0, operators_1.map)(([report]) => report));
    }
    return generateReport.pipe((0, operators_1.tap)({
        next: () => {
            console.log(`====>>>> MODULE CHURN REPORT GENERATED`);
        },
    }));
}
exports.moduleChurnReportCore = moduleChurnReportCore;
function enrichForCsv(mc, maxModuleDepth) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _mc = Object.assign({}, mc);
    _mc.created = _mc.created.toISOString();
    // fill one prop per each folder in the path of the module
    // if a module has less paths than the maximum number of folders found in a path (maxModuleDepth) then place an empty string as value
    const pathFolders = (0, split_path_1.splitPath)(mc.path);
    for (let i = 0; i < maxModuleDepth; i++) {
        const propName = `level_${i}`;
        const propVal = pathFolders.length > i ? pathFolders[i] : '';
        _mc[propName] = propVal;
    }
    return _mc;
}
function _moduleChurnReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)(({ churns, maxDepth }) => {
        const r = new ModuleChurnReport(params);
        const _modulesSortedPerChurn = churns.sort((a, b) => {
            // if the modules have the same churn, return the one that has the lowest depth, in this way we ensure that the root '.'
            // is always the first module even in the cases where in the root there is a folder which contains all the files and therefore
            // has the same churn
            const churnDiff = b.linesAddDel - a.linesAddDel;
            return churnDiff === 0 ? (0, split_path_1.splitPath)(a.path).length - (0, split_path_1.splitPath)(b.path).length : churnDiff;
        });
        const _topLevelModules = churns.filter((mc) => (0, split_path_1.splitPath)(mc.path).length === 1);
        _topLevelModules.forEach((mc) => {
            r.clocTot.val = r.clocTot.val + mc.cloc;
            r.numChurnedFiles.val = r.numChurnedFiles.val + mc.numChurnedFiles;
            r.totChurn.val = r.totChurn.val + mc.linesAddDel;
        });
        // set the default values in the params so that they are correctly reported in the report
        if (params.numberOfTopChurnModules === undefined) {
            params.numberOfTopChurnModules = report_config_1.REPORT_CONFIG.defaultTopChurnModulesListSize;
        }
        if (params.percentThreshold === undefined) {
            params.percentThreshold = report_config_1.REPORT_CONFIG.defaultPercentageThreshold;
        }
        r.churn_vs_cloc.val = r.totChurn.val / r.clocTot.val;
        r.numModules.val = churns.length;
        r.numChangedModules.val = churns.filter((c) => c.linesAddDel > 0).length;
        r.topChurnedModules.val = _modulesSortedPerChurn.slice(0, params.numberOfTopChurnModules);
        r.maxModuleDepth.val = maxDepth;
        return r;
    }));
}
exports._moduleChurnReport = _moduleChurnReport;
function addConsiderationsForModuleChurnReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    (0, report_1.addConsideration)(r, `The modules who have contributed most to the churn are ${r.topChurnedModules.val.map((m) => m.path)}.`);
    if (r.csvFile.val) {
        (0, report_1.addConsideration)(r, `The modules info have been saved in the file ${r.csvFile.val}.`);
    }
    return r;
}
exports.addConsiderationsForModuleChurnReport = addConsiderationsForModuleChurnReport;
//# sourceMappingURL=module-churn-report.js.map