"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests that the results in diffent reports are consistent
// for instance that the chrn in the file churn report is the same as the sum of the churns in the author churn report
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const author_churn_aggregate_1 = require("../1-C-aggregate-in-memory/author-churn-aggregate");
const commits_1 = require("../1-B-git-enriched-streams/commits");
const author_churn_report_1 = require("./author-churn-report");
const files_1 = require("../1-B-git-enriched-streams/files");
const file_churn_aggregate_1 = require("../1-C-aggregate-in-memory/file-churn-aggregate");
const file_churn_report_1 = require("./file-churn-report");
describe(`fileChurnReport compare with authorChurnReport`, () => {
    it(`Generates the reports and chacks that the total churn is the same. The churn is the same because it considers
    only the commits after a certain data and all the files after that date are present in the current project 
    and therefore in the cloc log.`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2021-01-01');
        // build the file churn report
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true, after);
        const fParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = (0, file_churn_report_1.fileChurnReportCore)(fileChurns, fParams);
        // build the author churn report
        const commits = (0, commits_1.gitCommitStream)(commitLogPath);
        const authorChurns = (0, author_churn_aggregate_1.authorChurn)(commits, after);
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = (0, author_churn_report_1.authorChurnReportCore)(authorChurns, params);
        (0, rxjs_1.forkJoin)([fChurnReport, authChurnReport])
            .pipe((0, rxjs_1.tap)((reports) => {
            const fReport = reports[0];
            const aReport = reports[1];
            (0, chai_1.expect)(fReport.totChurn.val).equal(aReport.totChurn.val);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`Generates the reports and verifies that the total churn for authorChurnReport is greater than the one for fileChurnReport. 
    The churn is the different because it considers all the commits and the files in the first commit are no longer 
    present in the current project and therefore they are not present in the cloc log.
    Since only the files with cloc > 0 are considered for the fileChurnReport, the files in the first commit are not
    considered for this report, hence the difference.`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;
        // build the file churn report
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, true);
        const fParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = (0, file_churn_report_1.fileChurnReportCore)(fileChurns, fParams);
        // build the author churn report
        const commits = (0, commits_1.gitCommitStream)(commitLogPath);
        const authorChurns = (0, author_churn_aggregate_1.authorChurn)(commits);
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = (0, author_churn_report_1.authorChurnReportCore)(authorChurns, params);
        (0, rxjs_1.forkJoin)([fChurnReport, authChurnReport])
            .pipe((0, rxjs_1.tap)((reports) => {
            const fReport = reports[0];
            const aReport = reports[1];
            (0, chai_1.expect)(fReport.totChurn.val).lt(aReport.totChurn.val);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`Generates the reports and verifies that the total churn for authorChurnReport is equal to the one for fileChurnReport. 
    The churn is the the same because fileChurnReport considers also the files with cloc zero.
    Therefore also the churn of the files that are not currently in the project is considered, which is the same logic
    applied when calculating the authorChurnReport`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';
        const commitLogPath = path_1.default.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;
        const ignoreClocZero = false;
        // build the file churn report
        const fileCommits = (0, files_1.filesStream)(commitLogPath, clocLogPath);
        const fileChurns = (0, file_churn_aggregate_1.fileChurn)(fileCommits, ignoreClocZero);
        const fParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = (0, file_churn_report_1.fileChurnReportCore)(fileChurns, fParams);
        // build the author churn report
        const commits = (0, commits_1.gitCommitStream)(commitLogPath);
        const authorChurns = (0, author_churn_aggregate_1.authorChurn)(commits);
        const params = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = (0, author_churn_report_1.authorChurnReportCore)(authorChurns, params);
        (0, rxjs_1.forkJoin)([fChurnReport, authChurnReport])
            .pipe((0, rxjs_1.tap)((reports) => {
            const fReport = reports[0];
            const aReport = reports[1];
            (0, chai_1.expect)(fReport.totChurn.val).equal(aReport.totChurn.val);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=cross-churn-reports.spec.js.map