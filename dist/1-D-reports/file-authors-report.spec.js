"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const files_1 = require("../1-B-git-enriched-streams/files");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const read_all_1 = require("../1-A-read/read-all");
const file_authors_report_1 = require("./file-authors-report");
const cloc_1 = require("../1-A-read/cloc");
const project_info_aggregate_1 = require("../1-C-aggregate-in-memory/project-info-aggregate");
const file_authors_aggregate_1 = require("../1-C-aggregate-in-memory/file-authors-aggregate");
describe(`fileAuthorsReportWithProjectInfo`, () => {
    it(`generates the report about the authors of the files as well as the general project info`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
        };
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_authors_report_1.projectAndFileAuthorsReport)(_fileAuthors, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // tests on the general project info held in the report
            (0, chai_1.expect)(report.totCommits.val).equal(4);
            // general tests on the author churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.fewAutorsFiles.val.length).equal(1);
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].commits).equal(1);
            (0, chai_1.expect)(report.manyAutorsFiles.val.length).equal(1);
            (0, chai_1.expect)(report.manyAutorsFiles.val[0].path).equal('touched-by-Authors-1-2-3-4.java');
            (0, chai_1.expect)(report.manyAutorsFiles.val[0].commits).equal(4);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`generates the report about the author churns - considers only the commits after a certain date`, (done) => {
        const repoName = 'a-git-repo-few-many-author';
        const repoFolderPath = `./test-data/${repoName}`;
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2019-01-01');
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
        const _clocSummaryInfo = (0, cloc_1.clocSummaryInfo)(repoFolderPath, outDir);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryInfo);
        (0, file_authors_report_1.projectAndFileAuthorsReport)(_fileAuthors, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // totCommits contains the number of all commits, not only the commits after the after date
            (0, chai_1.expect)(report.totCommits.val).equal(4);
            // general tests on the author churn report created
            (0, chai_1.expect)(report).not.undefined;
            (0, chai_1.expect)(report.fewAutorsFiles.val.length).equal(1);
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].path).equal('touched-by-Author-1-only.java');
            (0, chai_1.expect)(report.fewAutorsFiles.val[0].commits).equal(1);
            // there is no file with more than 3 authors if we start from 2019, so this value is 0
            (0, chai_1.expect)(report.manyAutorsFiles.val.length).equal(0);
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
        // read
        const commitOptions = { repoFolderPath, outDir, filter, reverse: true };
        const readClocOptions = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        // generation of the source streams
        const _commitStream = (0, commits_1.commitsStream)(commitLogPath);
        const _filesStream = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        const params = {
            repoFolderPath,
            commitLog: commitLogPath,
            outDir,
            after,
        };
        // aggregation
        const _fileAuthors = (0, file_authors_aggregate_1.fileAuthors)(_filesStream, params.after);
        const _projectInfo = (0, project_info_aggregate_1.projectInfo)(_commitStream, _clocSummaryStream);
        // generation of the report
        (0, file_authors_report_1.projectAndFileAuthorsReport)(_fileAuthors, _projectInfo, params)
            .pipe((0, rxjs_1.tap)((report) => {
            // test that some properties are greater than 0 - since this project is moving it is not possible to check for precise values
            (0, chai_1.expect)(report.totCommits.val).gt(0);
            (0, chai_1.expect)(report.clocTot.val).gt(0);
            (0, chai_1.expect)(report.fewAutorsFiles.val.length).gte(0);
            (0, chai_1.expect)(report.manyAutorsFiles.val.length).gte(0);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=file-authors-report.spec.js.map