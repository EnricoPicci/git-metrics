"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const commits_between_commits_1 = require("./commits-between-commits");
const rxjs_1 = require("rxjs");
describe(`commitsBetweenCommits$`, () => {
    it(`returns commits between 2 commits`, (done) => {
        const mostRecentCommit = 'HEAD';
        const leastRecentCommit = 'HEAD~1';
        (0, commits_between_commits_1.commitsBetweenCommits$)(mostRecentCommit, leastRecentCommit).pipe((0, rxjs_1.tap)((ret) => {
            (0, chai_1.expect)(ret).not.undefined;
            (0, chai_1.expect)(typeof ret).equal('string');
            (0, chai_1.expect)(ret.length).gt(0);
        }), (0, rxjs_1.finalize)(() => done())).subscribe();
    });
});
//# sourceMappingURL=commits-between-commits.spec.js.map