"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const file_churn_report_1 = require("../../1-D-reports/file-churn-report");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
describe(`runReportsSingleThread`, () => {
    it.skip(`runs some reports on any project project`, (done) => {
        const reports = [file_churn_report_1.FileChurnReport.name];
        const repoFolderPath = process.cwd();
        const filter = ['*.ts'];
        const after = '2021-01-01';
        const before = undefined;
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const clocDefsPath = undefined;
        const depthInFilesCoupling = 10;
        (0, run_reports_on_repo_core_1.runReportsSingleThread)(reports, repoFolderPath, filter, after, before, outDir, outFile, clocDefsPath, false, false, depthInFilesCoupling)
            .pipe((0, rxjs_1.tap)((_reports) => {
            (0, chai_1.expect)(_reports.length).equal(reports.length);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-reports-on-repo-core.spec.skip.js.map