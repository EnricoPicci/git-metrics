"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStreamsDistinctProcesses = exports.readAllParallel = exports.readAll = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const commit_functions_1 = require("../../../git-functions/commit.functions");
const cloc_functions_1 = require("../../../cloc-functions/cloc.functions");
const cloc_1 = require("./cloc");
// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
function readAll(commitOptions, clocParams) {
    // execute the git log command to extract the commits
    const commitLogPath = (0, commit_functions_1.writeCommitWithFileNumstat)(commitOptions);
    // execute the cloc commands
    const clocLogPath = (0, cloc_functions_1.writeClocByfile)(clocParams, 'readAll-fileLinesOptions');
    const clocSummaryPath = (0, cloc_functions_1.writeClocSummary)(clocParams);
    return [commitLogPath, clocLogPath, clocSummaryPath];
}
exports.readAll = readAll;
// read the git log and runs the cloc operations against a folder containing a repo. The read operations are performed in parallel distinct processes
// Return an Observable which emits the file paths of the logs created out of the read operations
function readAllParallel(commitOptions, clocParams) {
    const gitLogCommits = (0, commit_functions_1.writeCommitWithFileNumstat$)(commitOptions);
    const cloc = (0, cloc_functions_1.writeClocByFile$)(clocParams, 'cloc');
    const clocSummary = (0, cloc_functions_1.writeClocSummary$)(clocParams);
    return (0, rxjs_1.forkJoin)([gitLogCommits, cloc, clocSummary]);
}
exports.readAllParallel = readAllParallel;
// builds the Observables that perform the read operations against a git repo in separate processes
function readStreamsDistinctProcesses(commitOptions, clocParams) {
    const outGitFile = buildGitOutfile(commitOptions);
    const outClocSummaryFile = (0, cloc_1.buildSummaryClocOutfile)(clocParams);
    return _streamsDistinctProcesses(commitOptions, clocParams, outGitFile, outClocSummaryFile);
}
exports.readStreamsDistinctProcesses = readStreamsDistinctProcesses;
function _streamsDistinctProcesses(commitOptions, clocParams, outGitFile, outClocSummaryFile) {
    // build the stream of commits
    const gitLogCommits = (0, commit_functions_1.readCommitWithFileNumstat$)(commitOptions, outGitFile);
    // build the streams of cloc info
    const cloc = (0, cloc_functions_1.clocByfile$)(clocParams, 'create cloc log', true);
    const clocSummary = (0, cloc_1.clocSummaryAsStreamOfStrings$)(clocParams, outClocSummaryFile, 'git');
    return { gitLogCommits, cloc, clocSummary };
}
function buildGitOutfile(config) {
    let outDir = config.outDir ? config.outDir : './';
    outDir = path_1.default.resolve(outDir);
    const _postfix = config.reverse ? commit_functions_1.COMMITS_FILE_REVERSE_POSTFIX : commit_functions_1.COMMITS_FILE_POSTFIX;
    const outFile = (0, cloc_functions_1.buildOutfileName)(config.outFile, config.repoFolderPath, config.outFilePrefix, _postfix);
    const out = path_1.default.join(outDir, outFile);
    return out;
}
//# sourceMappingURL=read-all.js.map