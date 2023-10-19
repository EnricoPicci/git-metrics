"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const repo_path_functions_1 = require("./repo-path.functions");
describe(`gitRepoPaths`, () => {
    it(`returns one folder since we start from the folder containing the current project and this folder is a git repo`, (done) => {
        const start = process.cwd();
        (0, repo_path_functions_1.gitRepoPaths$)(start)
            .pipe((0, rxjs_1.tap)({
            next: (repos) => {
                (0, chai_1.expect)(repos).not.undefined;
                (0, chai_1.expect)(repos.length).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`fetchAllGitReposFromGivenFolder`, () => {
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, () => {
        const start = process.cwd();
        const repos = (0, repo_path_functions_1.fetchAllGitReposFromGivenFolder)(start);
        // in the folder of this project there is just one git repo
        (0, chai_1.expect)(repos.length).equal(1);
    });
});
//# sourceMappingURL=repo-path.spec.js.map