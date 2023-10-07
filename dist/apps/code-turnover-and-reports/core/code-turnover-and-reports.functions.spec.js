"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const code_turnover_and_reports_functions_1 = require("./code-turnover-and-reports.functions");
const run_reports_on_repo_core_1 = require("../../reports-on-repo/2-pipelines/internals/run-reports-on-repo-core");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
describe('reportsAndCodeTurnover', () => {
    it(`should gnerate the reports and calculate the code-turnover for all repos contained in this project folder -
    since in this project folder there is only one repo (the project repo) the calculations are done only for
    this repo`, (done) => {
        const folderPath = '.';
        const outDir = './out';
        const languages = ['TypeScript'];
        const fromDate = new Date('2023-09-23');
        const toDate = new Date('2023-09-24');
        const concurrency = 1;
        const excludeRepoPaths = [];
        const reports = run_reports_on_repo_core_1.allReports;
        const outFilePrefix = 'test';
        const clocDefsPath = '';
        const concurrentReadOfCommits = false;
        const noRenames = false;
        const ignoreClocZero = false;
        const removeBlanks = false;
        const removeNFiles = false;
        const removeComment = false;
        const removeSame = false;
        (0, code_turnover_and_reports_functions_1.reportsAndCodeTurnover)(folderPath, fromDate, toDate, outDir, languages, concurrency, excludeRepoPaths, reports, outFilePrefix, clocDefsPath, concurrentReadOfCommits, noRenames, ignoreClocZero, removeBlanks, removeNFiles, removeComment, removeSame).pipe((0, rxjs_1.tap)({
            next: data => {
                (0, chai_1.expect)(data.length).equal(2);
                const summaryReportPath = data[0].summaryReportPath;
                (0, chai_1.expect)(summaryReportPath.includes('summary')).true;
            },
        }), (0, rxjs_1.concatMap)(data => {
            const summaryReportPath = data[0].summaryReportPath;
            return (0, observable_fs_1.deleteFileObs)(summaryReportPath);
        })).subscribe({
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        });
    }).timeout(200000);
});
//# sourceMappingURL=code-turnover-and-reports.functions.spec.js.map