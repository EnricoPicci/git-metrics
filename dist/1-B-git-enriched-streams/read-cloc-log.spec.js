"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const read_cloc_log_1 = require("./read-cloc-log");
describe(`clocFileDict`, () => {
    it(`create a dictionary with the file path as key and the cloc info as value`, (done) => {
        const logName = 'git-repo-with-code-cloc.gitlog';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}`);
        (0, read_cloc_log_1.clocFileDict)(logFilePath)
            .pipe((0, rxjs_1.tap)((dict) => {
            (0, chai_1.expect)(Object.keys(dict).length).equal(3);
            const _fileName = './hallo.java';
            (0, chai_1.expect)(dict[_fileName].language).equal('Java');
            (0, chai_1.expect)(dict[_fileName].filename).equal(_fileName);
            (0, chai_1.expect)(dict[_fileName].blank).equal(3);
            (0, chai_1.expect)(dict[_fileName].comment).equal(1);
            (0, chai_1.expect)(dict[_fileName].code).equal(5);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=read-cloc-log.spec.js.map