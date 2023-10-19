import { tap, toArray } from "rxjs";
import { ClocParams } from "../cloc-functions/cloc-params";
import { clocByfile$ } from "../cloc-functions/cloc";
import { readCommitWithFileNumstat$ } from "../git-functions/commit";
import { GitLogCommitParams } from "../git-functions/git-params";
import { commitWithFileNumstatsEnrichedWithCloc$ } from "./commit-cloc.functions";
import { expect } from "chai";
import { clocFileDictFromClocStream$ } from "../cloc-functions/cloc-dictionary";


describe(`commitWithFileNumstatsEnrichedWithCloc$`, () => {
    it(`read the commits from a git repo and enrich the data related to the files of that commit
    with cloc data like lines of code, comment and blanks`, (done) => {
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['*.md'],
            after: '2018-01-01',
            before: '2021-12-31',
            outDir: '',
        };

        const commits$ = readCommitWithFileNumstat$(params);

        const clocParams: ClocParams = {
            folderPath: process.cwd(),
            vcs: 'git',
        };
        const cloc$ = clocByfile$(clocParams, 'create cloc log', false)
        const clocDict$ = clocFileDictFromClocStream$(cloc$);

        commitWithFileNumstatsEnrichedWithCloc$(commits$, clocDict$)
            .pipe(
                tap({
                    next: (commitRec) => {
                        expect(commitRec).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (commitRecords) => {
                        expect(commitRecords).not.undefined;
                        expect(commitRecords.length).gt(0);

                        // to get the oldest commit, reverse the array and get the first element
                        const firstCommit = commitRecords.reverse()[0];
                        const readmeFile = firstCommit.files.find((file) => file.path.includes('README.md'));
                        if (!readmeFile) {
                            throw new Error(`No readme file found in the first commit`);
                        }
                        // the test selects only md files, so there should be a readme.md file which is should have
                        // some lines of code
                        expect(readmeFile.code).gt(0);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});