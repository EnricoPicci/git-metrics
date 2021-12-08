"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const files_1 = require("../1-B-git-enriched-streams/files");
const repo_coupling_report_1 = require("./repo-coupling-report");
const repo_coupling_aggregate_1 = require("../1-C-aggregate-in-memory/repo-coupling-aggregate");
describe(`flatFilesCsv`, () => {
    it(`generate an array of strings, each representing one file in a specific tuple, in csv format`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path_1.default.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);
        const timeWindowLengthInDays = 1;
        const fileTupleDict = (0, repo_coupling_aggregate_1.fileTuplesDict)([(0, files_1.filesStream)(logFilePath, clocLogPath), (0, files_1.filesStream)(logFilePath, clocLogPath)], timeWindowLengthInDays);
        fileTupleDict
            .pipe((0, repo_coupling_report_1.flatFilesCsv)(), (0, operators_1.toArray)(), (0, operators_1.tap)({
            next: (fileTuplesCsv) => {
                // there are 9 tuples, each containing 2 files, plus the first line (the header)
                (0, chai_1.expect)(fileTuplesCsv.length).equal(19);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
//# sourceMappingURL=repo-coupling-report.spec.js.map