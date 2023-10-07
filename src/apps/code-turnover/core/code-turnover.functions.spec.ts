import { expect } from "chai";
import { calculateCodeTurnover } from "./code-turnover.functions";

describe('calculateCodeTurnover', () => {
    it(`should calculate the cloc diffs for each commit vs its parent commit for all repos
    in this project reposInFolder. Since this project folder contains only one repoPath, the repo of the projectAndAuthorChurnReport,
    the commits will be calculated just for this folder`, (done) => {
        const folderPath = '.';
        const outDir = './out';
        const languages = ['TypeScript'];
        const fromDate = new Date('2023-09-23');
        const toDate = new Date('2023-09-24');
        const concurrency = 1;
        const excludeRepoPaths = ['node_modules'];

        calculateCodeTurnover(folderPath, outDir, languages, fromDate, toDate, concurrency, excludeRepoPaths, false, false, false).subscribe({
            next: commitDiffStats => {
                expect(commitDiffStats.length).greaterThan(0);
            },
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        })
    }).timeout(200000);

    it(`should calculate no cloc diffs since there are no commits in the time window provided`, (done) => {
        const folderPath = '.';
        const outDir = './out';
        const languages = ['TypeScript'];
        const fromDate = new Date('2023-09-23');
        const toDate = new Date('2023-09-23');
        const concurrency = 1;
        const excludeRepoPaths = ['node_modules'];

        calculateCodeTurnover(folderPath, outDir, languages, fromDate, toDate, concurrency, excludeRepoPaths, false, false, false).subscribe({
            next: commitDiffStats => {
                expect(commitDiffStats.length).equal(0);
            },
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        })
    }).timeout(200000);
});
