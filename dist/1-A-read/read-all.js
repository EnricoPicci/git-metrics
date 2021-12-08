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
// performs all the read operations against a git repo in parallel distinct processes and return an Observable which emits
// the file paths of the logs created out of the read operations
function readAllParallel(commitOptions, readClocOptions) {
    const outGitFile = (0, read_git_1.buildGitOutfile)(commitOptions);
    const outClocFile = (0, cloc_1.buildClocOutfile)(readClocOptions);
    const outClocSummaryFile = (0, cloc_1.buildSummaryClocOutfile)(readClocOptions);
    const { gitLogCommits, cloc, clocSummary } = _readStreamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocFile, outClocSummaryFile);
    const _gitLogCommits = gitLogCommits.pipe((0, rxjs_1.last)(), (0, rxjs_1.map)(() => outGitFile));
    const _cloc = cloc.pipe((0, rxjs_1.last)(), (0, rxjs_1.map)(() => outClocFile));
    const _clocSummary = clocSummary.pipe((0, rxjs_1.last)(), (0, rxjs_1.map)(() => outClocSummaryFile));
    return (0, rxjs_1.forkJoin)([_gitLogCommits, _cloc, _clocSummary]);
}
exports.readAllParallel = readAllParallel;
// builds the Observables that perform the read operations against a git repo in separate processes
function readStreamsDistinctProcesses(commitOptions, readClocOptions) {
    const outGitFile = (0, read_git_1.buildGitOutfile)(commitOptions);
    const outClocFile = (0, cloc_1.buildClocOutfile)(readClocOptions);
    const outClocSummaryFile = (0, cloc_1.buildSummaryClocOutfile)(readClocOptions);
    return _readStreamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocFile, outClocSummaryFile);
}
exports.readStreamsDistinctProcesses = readStreamsDistinctProcesses;
function _readStreamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocFile, outClocSummaryFile) {
    // build the stream of commits
    const gitLogCommits = (0, read_git_1.readCommitsNewProces)(commitOptions, outGitFile);
    // build the streams of cloc info
    const cloc = (0, cloc_1.createClocNewProcess)(readClocOptions, outClocFile, 'create cloc log');
    const clocSummary = (0, cloc_1.createSummaryClocNewProcess)(readClocOptions, outClocSummaryFile, 'create cloc summary log');
    return { gitLogCommits, cloc, clocSummary };
}
//# sourceMappingURL=read-all.js.map