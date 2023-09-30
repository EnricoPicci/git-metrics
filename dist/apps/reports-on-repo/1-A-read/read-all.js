"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStreamsDistinctProcesses = exports.readAllParallel = exports.readAll = void 0;
const cloc_1 = require("./cloc");
const read_git_1 = require("./read-git");
const rxjs_1 = require("rxjs");
// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
function readAll(commitOptions, readClocOptions) {
    // execute the git log command to extract the commits
    const commitLogPath = (0, read_git_1.readCommits)(commitOptions);
    // execute the cloc commands
    const clocLogPath = (0, cloc_1.createClocLog)(readClocOptions, 'readAll-fileLinesOptions');
    const clocSummaryPath = (0, cloc_1.createSummaryClocLog)(readClocOptions);
    return [commitLogPath, clocLogPath, clocSummaryPath];
}
exports.readAll = readAll;
// read the git log and runs the cloc operations against a folder containing a repo. The read operations are performed in parallel distinct processes
// Return an Observable which emits the file paths of the logs created out of the read operations
function readAllParallel(commitOptions, readClocOptions) {
    const gitLogCommits = (0, read_git_1.readCommitsNewProcess)(commitOptions);
    const cloc = (0, cloc_1.createClocLogNewProcess)(readClocOptions);
    const clocSummary = (0, cloc_1.createSummaryClocNewProcess)(readClocOptions);
    return (0, rxjs_1.forkJoin)([gitLogCommits, cloc, clocSummary]);
}
exports.readAllParallel = readAllParallel;
// builds the Observables that perform the read operations against a git repo in separate processes
function readStreamsDistinctProcesses(commitOptions, readClocOptions) {
    const outGitFile = (0, read_git_1.buildGitOutfile)(commitOptions);
    const outClocSummaryFile = (0, cloc_1.buildSummaryClocOutfile)(readClocOptions);
    return _streamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocSummaryFile, false);
}
exports.readStreamsDistinctProcesses = readStreamsDistinctProcesses;
function _streamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocSummaryFile, writeFileOnly) {
    // build the stream of commits
    const gitLogCommits = (0, read_git_1.readAndStreamCommitsNewProces)(commitOptions, outGitFile, writeFileOnly);
    // build the streams of cloc info
    const cloc = (0, cloc_1.streamClocNewProcess)(readClocOptions, 'create cloc log');
    const clocSummary = (0, cloc_1.streamSummaryClocNewProcess)(readClocOptions, outClocSummaryFile, 'git');
    return { gitLogCommits, cloc, clocSummary };
}
//# sourceMappingURL=read-all.js.map