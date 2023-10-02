import { tap, toArray } from "rxjs";
import { ClocParams } from "../cloc-functions/cloc-params";
import { clocByfile$, clocFileDictFromClocStream$ } from "../cloc-functions/cloc.functions";
import { readCommitWithFileNumstatFromLog$ } from "../git-functions/commit.functions";
import { GitLogCommitParams } from "../git-functions/git-params";
import { commitWithFileNumstatsEnrichedWithCloc$ } from "./git-cloc.functions";
import { expect } from "chai";


describe(`commitWithFileNumstatsEnrichedWithCloc$`, () => {
    it.only(`read the commits from a git repo and enrich the data related to the files of that commit
    with cloc data like lines of code, comment and blanks`, (done) => {
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['*.md'],
            after: '2018-01-01',
            outDir: '',
        };

        const commits$ = readCommitWithFileNumstatFromLog$(params);

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

                        const firstCommit = commitRecords[0];
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