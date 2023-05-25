"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const cloc_1 = require("../1-A-read/cloc");
const project_info_aggregate_1 = require("../1-C-aggregate-in-memory/project-info-aggregate");
const branches_report_1 = require("./branches-report");
const commit_branch_tips_aggregate_1 = require("../1-C-aggregate-in-memory/commit-branch-tips-aggregate");
const read_all_1 = require("../1-A-read/read-all");
const commits_and_branch_tips_1 = require("../1-B-git-enriched-streams/commits-and-branch-tips");
describe(`projectAndBranchesReport`, () => {
    it(`generates the report about the branches as well as the general project info`, (done) => {
        const repoName = 'a-project-with-git-branches';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const csvFile = path_1.default.join(outDir, 'projectAndBranchesReport-csv.csv');
        const weeklyCsvFile = path_1.default.join(outDir, 'thisProjectWeeklyBranchesReport-csv.csv');
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };
        const commitsWithBranchTips = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
        const daylySummaryDictionary = (0, commit_branch_tips_aggregate_1.commitDaylySummary)(commitsWithBranchTips);
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, branches_report_1.projectAndBranchesReport)(daylySummaryDictionary, _projectInfo, params, csvFile, weeklyCsvFile)
            .pipe((0, rxjs_1.tap)((report) => {
            // tests on the general project info held in the report
            // there are 12 commits, 3 are merges and 9 are the normal commits
            (0, chai_1.expect)(report.totCommits.val).equal(12);
            // general tests on the author churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCommits.val).equal(4);
            (0, chai_1.expect)(report.maxMerges.val).equal(1);
            (0, chai_1.expect)(report.maxBranchTips.val).equal(2);
            (0, chai_1.expect)(report.branchTips.val.length).equal(1);
            (0, chai_1.expect)(report.branchTips.val[0]).equal('commit_9');
            // tests on the data about merges
            (0, chai_1.expect)(report.totMerges.val).equal(3);
            (0, chai_1.expect)(report.averageLinesAddDelForMerge.val).equal(54 / 3);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
    it(`generates the report about the branches using this repo as a real repo`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const csvFile = path_1.default.join(outDir, 'thisProjectBranchesReport-csv.csv');
        const weeklyCsvFile = path_1.default.join(outDir, 'thisProjectWeeklyBranchesReport-csv.csv');
        const filter = ['*.ts'];
        // const after = undefined;
        // read
        const commitOptions = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };
        // aggregation
        const commitsWithBranchTips = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath).pipe((0, commits_and_branch_tips_1.commitWithBranchTips)());
        const daylySummaryDictionary = (0, commit_branch_tips_aggregate_1.commitDaylySummary)(commitsWithBranchTips);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream);
        (0, branches_report_1.projectAndBranchesReport)(daylySummaryDictionary, _projectInfo, params, csvFile, weeklyCsvFile)
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report.totCommits.val).gt(0);
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCommits.val).gt(0);
            (0, chai_1.expect)(report.branchTips.val.length).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(50000);
});
//# sourceMappingURL=branches-report.spec.js.map