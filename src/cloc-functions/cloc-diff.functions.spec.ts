import { expect } from 'chai';
import { buildClocDiffAllCommand } from './cloc-diff.functions';

describe('buildClocDiffAllCommand', () => {
    it('should return a command string with the correct folder path, commits, and language filters', () => {
        const folderPath = './my-repo';
        const mostRecentCommit = 'abc123';
        const leastRecentCommit = 'def456';
        const languages = ['JavaScript', 'TypeScript'];
        const expectedCommand = `cd ${folderPath} && cloc --git-diff-all --json --timeout=1000000 --include-lang=JavaScript,TypeScript ${leastRecentCommit} ${mostRecentCommit}`;
        const command = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
        expect(command).equal(expectedCommand);
    });

    it('should return a command string with default folder path and language filters if not provided', () => {
        const mostRecentCommit = 'abc123';
        const leastRecentCommit = 'def456';
        const expectedCommand = `cd ./ && cloc --git-diff-all --json --timeout=1000000 --include-lang=JavaScript ${leastRecentCommit} ${mostRecentCommit}`;
        const command = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, ['JavaScript']);
        expect(command).equal(expectedCommand);
    });
});