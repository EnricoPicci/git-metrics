"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBranchesReportFromStreams = exports.runBranchesReport = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const read_all_1 = require("../../git-read-enrich/read-all");
const create_outdir_1 = require("../../git-read-enrich/create-outdir");
const commits_1 = require("../../git-read-enrich/commits");
const cloc_1 = require("../../git-read-enrich/cloc");
const project_info_aggregate_1 = require("../../aggregate-in-memory/project-info-aggregate");
const add_project_info_1 = require("../../reports/add-project-info");
const commit_branch_tips_aggregate_1 = require("../../aggregate-in-memory/commit-branch-tips-aggregate");
const branches_report_1 = require("../../reports/branches-report");
function runBranchesReport(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read the data from git and cloc tool
    const commitOptions = { repoFolderPath, outDir, noRenames, reverse: true };
    const readClocOptions = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    // generation of the source streams
    const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
    // run the reports
    return runBranchesReportFromStreams(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, _commitStream, _clocSummaryStream);
}
exports.runBranchesReport = runBranchesReport;
function runBranchesReportFromStreams(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, _commitStream, _clocSummaryStream) {
    const params = {
        repoFolderPath,
        outDir,
        clocDefsPath,
        after: new Date(after),
    };
    const repoName = path_1.default.parse(repoFolderPath).name;
    const _outFileBranches = outFilePrefix ? `${outFilePrefix}-branches.csv` : `${repoName}-branches.csv`;
    const csvBranches = path_1.default.join(outDir, _outFileBranches);
    // aggregation
    const _daylySummaryDictionary = _commitStream.pipe((0, commit_branch_tips_aggregate_1.commitDaylySummary)());
    return (0, rxjs_1.forkJoin)([
        (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream),
        (0, branches_report_1.branchesReportCore)(_daylySummaryDictionary, params, csvBranches),
    ]).pipe((0, operators_1.map)(([_projectInfo, _branchesReport]) => {
        (0, add_project_info_1.addProjectInfo)(_branchesReport, _projectInfo, csvBranches);
        return [(0, branches_report_1.addConsiderationsForBranchesReport)(_branchesReport)];
    }));
}
exports.runBranchesReportFromStreams = runBranchesReportFromStreams;
//# sourceMappingURL=run-branches-report-core.js.map