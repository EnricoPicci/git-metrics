"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const cloc_1 = require("../cloc-functions/cloc");
const commit_functions_1 = require("../git-functions/commit.functions");
const commit_cloc_functions_1 = require("./commit-cloc.functions");
const chai_1 = require("chai");
const cloc_dictionary_1 = require("../cloc-functions/cloc-dictionary");
describe(`commitWithFileNumstatsEnrichedWithCloc$`, () => {
    it(`read the commits from a git repo and enrich the data related to the files of that commit
    with cloc data like lines of code, comment and blanks`, (done) => {
        const params = {
            repoFolderPath: process.cwd(),
            filter: ['*.md'],
            after: '2018-01-01',
            before: '2021-12-31',
            outDir: '',
        };
        const commits$ = (0, commit_functions_1.readCommitWithFileNumstat$)(params);
        const clocParams = {
            folderPath: process.cwd(),
            vcs: 'git',
        };
        const cloc$ = (0, cloc_1.clocByfile$)(clocParams, 'create cloc log', false);
        const clocDict$ = (0, cloc_dictionary_1.clocFileDictFromClocStream$)(cloc$);
        (0, commit_cloc_functions_1.commitWithFileNumstatsEnrichedWithCloc$)(commits$, clocDict$)
            .pipe((0, rxjs_1.tap)({
            next: (commitRec) => {
                (0, chai_1.expect)(commitRec).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (commitRecords) => {
                (0, chai_1.expect)(commitRecords).not.undefined;
                (0, chai_1.expect)(commitRecords.length).gt(0);
                // to get the oldest commit, reverse the array and get the first element
                const firstCommit = commitRecords.reverse()[0];
                const readmeFile = firstCommit.files.find((file) => file.path.includes('README.md'));
                if (!readmeFile) {
                    throw new Error(`No readme file found in the first commit`);
                }
                // the test selects only md files, so there should be a readme.md file which is should have
                // some lines of code
                (0, chai_1.expect)(readmeFile.code).gt(0);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
//# sourceMappingURL=commit-cloc.functions.spec.js.map