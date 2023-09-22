"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const run_repo_coupling_report_core_1 = require("./run-repo-coupling-report-core");
describe(`runRepoCouplingReport`, () => {
    it(`read git, runs cloc and run the reports on this project and its repo`, (done) => {
        const repoFolderPath_1 = process.cwd();
        const repoFolderPath_2 = process.cwd();
        const timeWindowLengthInDays = 1;
        const csvFilePath = path_1.default.join(process.cwd(), 'temp', 'this-repo-coupling-with-itself.csv');
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const outClocFile = undefined;
        const clocDefsPath = undefined;
        (0, run_repo_coupling_report_core_1.runRepoCouplingReport)([repoFolderPath_1, repoFolderPath_2], timeWindowLengthInDays, csvFilePath, filter, after, outDir, outFile, outClocFile, clocDefsPath)
            .pipe((0, rxjs_1.tap)((csvFile) => {
            (0, chai_1.expect)(csvFile).not.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-repo-coupling-report-core.spec.js.map