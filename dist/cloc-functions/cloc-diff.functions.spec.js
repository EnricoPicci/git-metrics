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
//# sourceMappingURL=cloc-diff.functions.spec.js.map