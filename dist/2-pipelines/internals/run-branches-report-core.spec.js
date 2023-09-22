"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const commits_1 = require("../../reports-on-repos/1-B-git-enriched-streams/commits");
const run_branches_report_core_1 = require("./run-branches-report-core");
describe(`runBranchesReport`, () => {
    it(`runs branches report on this project`, (done) => {
        const repoFolderPath = process.cwd();
        const after = '2017-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFilePrefix = undefined;
        const clocDefsPath = undefined;
        commits_1.COMMIT_RECORD_COUNTER.count = true;
        const runSingleStream = (0, run_branches_report_core_1.runBranchesReport)(repoFolderPath, after, outDir, outFilePrefix, clocDefsPath, false);
        runSingleStream
            .pipe((0, rxjs_1.tap)((report) => {
            (0, chai_1.expect)(report).not.undefined;
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(600000);
});
//# sourceMappingURL=run-branches-report-core.spec.js.map