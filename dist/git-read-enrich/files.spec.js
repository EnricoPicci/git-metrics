"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const date_functions_1 = require("../tools/dates/date-functions");
const files_1 = require("./files");
const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
describe(`filesStream`, () => {
    it(`reads the commit and cloc info and generates a stream of FileDocs`, (done) => {
        (0, files_1.filesStream)(commitLogPath, clocLogPath)
            .pipe((0, rxjs_1.tap)({
            next: (fileCommit) => {
                (0, chai_1.expect)(fileCommit).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (allFileCommits) => {
                (0, chai_1.expect)(allFileCommits.length).equal(7);
                allFileCommits
                    .filter((f) => f.path === 'hallo.java')
                    .forEach((f) => (0, chai_1.expect)((0, date_functions_1.toYYYYMMDD)(f.created)).equal('2019-09-22'));
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=files.spec.js.map