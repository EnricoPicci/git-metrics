"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const report_1 = require("../../reports/report");
const load_mongo_run_reports_core_1 = require("./load-mongo-run-reports-core");
describe(`loadMongRunReports`, () => {
    it(`read git, load mongo and run the reports on this project and its repo`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        const repoFolderPath = process.cwd();
        const filter = ['*.ts*'];
        const after = '2021-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const outClocFile = undefined;
        const dbName = 'io-backend';
        const collName = undefined;
        const buffer = undefined;
        const clocDefsPath = undefined;
        const logProgress = false;
        // const connectionString = 'mongodb://localhost:27017';
        // const repoFolderPath = '~/temp/immuni-app-android';
        // const filter = undefined;
        // const after = '2021-01-01';
        // const outDir = `${process.cwd()}/temp`;
        // const outFile = undefined;
        // const outClocFile = undefined;
        // const dbName = 'immuni-app-android';
        // const collName = undefined;
        // const buffer = undefined;
        (0, load_mongo_run_reports_core_1.loadMongRunReports)(connectionString, repoFolderPath, filter, after, outDir, outFile, outClocFile, dbName, collName, buffer, clocDefsPath, logProgress)
            .pipe((0, rxjs_1.tap)((reports) => {
            (0, chai_1.expect)(reports).not.undefined;
            const _reports = (0, report_1.addProjectInfoConsiderations)(reports);
            _reports.forEach((report) => report.considerations.forEach((l) => console.log(l)));
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=load-mongo-run-reports-core.spec.js.map