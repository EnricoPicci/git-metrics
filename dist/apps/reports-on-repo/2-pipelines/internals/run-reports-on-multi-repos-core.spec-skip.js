"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const repo_path_1 = require("../../../../git-functions/repo-path");
describe(`gitRepos`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, (done) => {
        const start = path_1.default.parse(process.cwd()).dir;
        (0, repo_path_1.gitRepoPaths$)(start)
            .pipe((0, rxjs_1.tap)({
            next: (repos) => {
                (0, chai_1.expect)(repos).not.undefined;
                (0, chai_1.expect)(repos.length).gt(0);
                const currentFolder = process.cwd();
                (0, chai_1.expect)(repos.includes(currentFolder)).true;
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`fetchAllGitReposFromGivenFolder`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, () => {
        const start = path_1.default.parse(process.cwd()).dir;
        const repos = (0, repo_path_1.fetchAllGitReposFromGivenFolder)(start);
        // in the parent folder of this folder there cab be other git repos
        (0, chai_1.expect)(repos.length).gte(1);
    });
});
//# sourceMappingURL=run-reports-on-multi-repos-core.spec-skip.js.map