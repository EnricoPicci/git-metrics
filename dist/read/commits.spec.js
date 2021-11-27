"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const rxjs_1 = require("rxjs");
const commits_1 = require("./commits");
describe(`splitCommits`, () => {
    it(`returns a stream of arrays of strings, each array containing all the data related to a specific commit`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        (0, commits_1.splitCommits)(logFilePath)
            .pipe((0, rxjs_1.toArray)())
            .subscribe({
            next: (commits) => {
                (0, chai_1.expect)(commits.length).equal(3);
                // top commit
                (0, chai_1.expect)(commits[0].length).equal(3);
                // middle commit
                (0, chai_1.expect)(commits[1].length).equal(2);
                // bottom commit
                (0, chai_1.expect)(commits[2].length).equal(3);
            },
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=commits.spec.js.map