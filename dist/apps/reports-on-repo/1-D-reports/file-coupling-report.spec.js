"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const file_coupling_aggregate_1 = require("../1-C-aggregate-in-memory/file-coupling-aggregate");
const project_info_aggregate_1 = require("../1-C-aggregate-in-memory/project-info-aggregate");
const cloc_1 = require("../1-A-read/cloc");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const read_all_1 = require("../1-A-read/read-all");
const file_coupling_report_1 = require("./file-coupling-report");
describe(`fileCouplingReportCore`, () => {
    it(`generates the report about the churn of files and checks that the report has been filled`, (done) => {
        const repoName = 'io-backend';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const depthInFilesCoupling = 10;
        const commits = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const fileCouplingStream = (0, file_coupling_aggregate_1.fileCoupling)(commits, depthInFilesCoupling);
        const outDir = `${process.cwd()}/temp`;
        const params = {
            outDir,
        };
        (0, file_coupling_report_1.fileCouplingReportCore)(fileCouplingStream, params)
            .pipe((0, operators_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCouplings.val.length).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`projectAndFileCouplingReport`, () => {
    it(`generates the report about file couplings and checks that the report has been filled with something`, (done) => {
        const repoName = 'a-git-repo';
        const outDir = `${process.cwd()}/temp`;
        const after = undefined;
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const depthInFilesCoupling = 10;
        // generation of the source streams
        const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const params = {
            repoFolderPath,
            outDir,
            after,
        };
        // aggregation
        const _fileCoupling = (0, file_coupling_aggregate_1.fileCoupling)(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_coupling_report_1.projectAndFileCouplingReport)(_fileCoupling, _projectInfo, params)
            .pipe((0, operators_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCouplings.val.length).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about file couplings but considers only commits in the future. Since git log can not find commits in the future,
    then filesCouplingInfo should be empty`, (done) => {
        const repoName = 'a-git-repo';
        const outDir = `${process.cwd()}/temp`;
        const after = new Date();
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const depthInFilesCoupling = 10;
        // generation of the source streams
        const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const params = {
            repoFolderPath,
            outDir,
            after,
        };
        // aggregation
        const _fileCoupling = (0, file_coupling_aggregate_1.fileCoupling)(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_coupling_report_1.projectAndFileCouplingReport)(_fileCoupling, _projectInfo, params)
            .pipe((0, operators_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCouplings.val.length).equal(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read - source stream generation - aggregation - generation of the report about this project`, (done) => {
        // input from the user
        const repoFolderPath = `./`;
        const outDir = `${process.cwd()}/temp`;
        const filter = ['*.ts'];
        const after = undefined;
        const depthInFilesCoupling = 10;
        // read
        const commitOptions = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const params = {
            repoFolderPath,
            outDir,
            after,
        };
        // aggregation
        const _fileCoupling = (0, file_coupling_aggregate_1.fileCoupling)(_commitStream, depthInFilesCoupling, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream);
        (0, file_coupling_report_1.projectAndFileCouplingReport)(_fileCoupling, _projectInfo, params)
            .pipe((0, operators_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.maxCouplings.val.length).gt(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=file-coupling-report.spec.js.map