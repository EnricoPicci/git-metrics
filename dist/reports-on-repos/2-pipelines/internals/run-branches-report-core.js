"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBranchesReportFromStreams = exports.runBranchesReport = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const read_all_1 = require("../../1-A-read/read-all");
const create_outdir_1 = require("../../1-A-read/create-outdir");
const cloc_1 = require("../../1-A-read/cloc");
const commits_1 = require("../../1-B-git-enriched-streams/commits");
const commits_and_branch_tips_1 = require("../../1-B-git-enriched-streams/commits-and-branch-tips");
const project_info_aggregate_1 = require("../../1-C-aggregate-in-memory/project-info-aggregate");
const commit_branch_tips_aggregate_1 = require("../../1-C-aggregate-in-memory/commit-branch-tips-aggregate");
const add_project_info_1 = require("../../1-D-reports/add-project-info");
const branches_report_1 = require("../../1-D-reports/branches-report");
function runBranchesReport(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // read the data from git and cloc tool
    const commitOptions = {
        repoFolderPath,
        outDir,
        noRenames,
        reverse: true,
        includeMergeCommits: true,
        firstParent: true,
    };
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
    const csvFile = path_1.default.join(outDir, _outFileBranches);
    const _outFileWeeklyBranches = outFilePrefix
        ? `${outFilePrefix}-branches-weekly.csv`
        : `${repoName}-branches-weekly.csv`;
    const weeklyCsvFile = path_1.default.join(outDir, _outFileWeeklyBranches);
    const _commitsWithBranchTips = _commitStream.pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
    // aggregation
    const _daylySummaryDictionary = (0, commit_branch_tips_aggregate_1.commitDaylySummary)(_commitsWithBranchTips);
    return (0, rxjs_1.forkJoin)([
        (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream),
        (0, branches_report_1.branchesReportCore)(_daylySummaryDictionary, params, csvFile, weeklyCsvFile),
    ]).pipe((0, operators_1.map)(([_projectInfo, _branchesReport]) => {
        (0, add_project_info_1.addProjectInfo)(_branchesReport, _projectInfo, csvFile);
        return (0, branches_report_1.addConsiderationsForBranchesReport)(_branchesReport);
    }));
}
exports.runBranchesReportFromStreams = runBranchesReportFromStreams;
//# sourceMappingURL=run-branches-report-core.js.map