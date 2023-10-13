"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cloc_diff_functions_1 = require("./cloc-diff.functions");
describe('buildClocDiffAllCommand', () => {
    it('should return a command string with the correct folder path, commits, and language filters', () => {
        const folderPath = './my-repo';
        const mostRecentCommit = 'abc123';
        const leastRecentCommit = 'def456';
        const languages = ['JavaScript', 'TypeScript'];
        const expectedCommand = `cd ${folderPath} && cloc --git-diff-all --json --timeout=1000000 --include-lang=JavaScript,TypeScript ${leastRecentCommit} ${mostRecentCommit}`;
        const command = (0, cloc_diff_functions_1.buildClocDiffAllCommand)(mostRecentCommit, leastRecentCommit, languages, folderPath);
        (0, chai_1.expect)(command).equal(expectedCommand);
    });
    it('should return a command string with default folder path and language filters if not provided', () => {
        const mostRecentCommit = 'abc123';
        const leastRecentCommit = 'def456';
        const expectedCommand = `cd ./ && cloc --git-diff-all --json --timeout=1000000 --include-lang=JavaScript ${leastRecentCommit} ${mostRecentCommit}`;
        const command = (0, cloc_diff_functions_1.buildClocDiffAllCommand)(mostRecentCommit, leastRecentCommit, ['JavaScript']);
        (0, chai_1.expect)(command).equal(expectedCommand);
    });
});
describe('runClocDiff', () => {
    it(`should generate an Observable that emits a value of type ClocDiffStats using the third commit of this project
    compared with the second commit of this project`, (done) => {
        const folderPath = './';
        const thirdCommitSha = '61d40fc0b383d9eb215217b8de1abe41ba6c9ee7';
        const mostRecentCommit = thirdCommitSha;
        const leastRecentCommit = `${thirdCommitSha}^1`;
        const languages = ['JavaScript', 'TypeScript'];
        let count = 0;
        (0, cloc_diff_functions_1.runClocDiff)(mostRecentCommit, leastRecentCommit, languages, folderPath).subscribe({
            next: (clocDiffStats) => {
                count++;
                (0, chai_1.expect)(clocDiffStats).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.added).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.removed).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.same).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.modified).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.added.TypeScript).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.modified.TypeScript).to.be.an('object');
                (0, chai_1.expect)(clocDiffStats.diffs.modified.TypeScript.code).equal(1);
                (0, chai_1.expect)(clocDiffStats.diffs.added.TypeScript.possibleCutPaste).equal(false);
            },
            error: (error) => {
                done(error);
            },
            complete: () => {
                (0, chai_1.expect)(count).equal(1);
                done();
            }
        });
    }).timeout(1000000);
});
//# sourceMappingURL=cloc-diff.functions.spec.js.map