import { createClocLog, createSummaryClocLog } from './cloc';
import { ConfigReadCommits, ConfigReadCloc } from './read-params/read-params';
import { readCommits } from './read-git';

// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
export function readAll(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    // execute the git log command to extract the commits
    const commitLogPath = readCommits(commitOptions);

    // execute the cloc commands
    const clocLogPath = createClocLog(readClocOptions, 'readAll-fileLinesOptions');
    const clocSummaryPath = createSummaryClocLog(readClocOptions);

    return [commitLogPath, clocLogPath, clocSummaryPath];
}
