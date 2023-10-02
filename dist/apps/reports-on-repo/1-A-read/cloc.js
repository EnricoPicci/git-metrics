"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummaryInfo = exports.buildSummaryClocOutfile = exports.buildClocOutfile = exports.paramsFromConfig = exports.createSummaryClocNewProcess = exports.clocSummaryAsStreamOfStrings$ = exports.createSummaryClocLog = exports.createClocLogNewProcess = exports.streamClocNewProcess = exports.createClocLog = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const read_git_1 = require("./read-git");
const cloc_functions_1 = require("../../../cloc-functions/cloc.functions");
function createClocLog(config, action) {
    const params = paramsFromConfig(config);
    return (0, cloc_functions_1.writeClocByfile)(params, action);
}
exports.createClocLog = createClocLog;
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function streamClocNewProcess(config, action) {
    const params = paramsFromConfig(config);
    return (0, cloc_functions_1.clocByfile$)(params, action, true);
}
exports.streamClocNewProcess = streamClocNewProcess;
function createClocLogNewProcess(config, action = 'cloc') {
    const params = paramsFromConfig(config);
    return (0, cloc_functions_1.writeClocByFile$)(params, action);
}
exports.createClocLogNewProcess = createClocLogNewProcess;
function createSummaryClocLog(config, action = 'clocSummary') {
    const params = paramsFromConfig(config);
    return (0, cloc_functions_1.writeClocSummary)(params, action);
}
exports.createSummaryClocLog = createSummaryClocLog;
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function clocSummaryAsStreamOfStrings$(config, outFile, vcs) {
    return (0, cloc_functions_1.clocSummary$)(config.repoFolderPath, vcs, outFile).pipe((0, rxjs_1.concatMap)(stats => (0, rxjs_1.from)(stats)), (0, rxjs_1.map)(stat => `${stat.nFiles},${stat.language},${stat.blank},${stat.comment},${stat.code}`));
}
exports.clocSummaryAsStreamOfStrings$ = clocSummaryAsStreamOfStrings$;
function createSummaryClocNewProcess(config, _action = 'clocSummary') {
    const params = paramsFromConfig(config);
    return (0, cloc_functions_1.writeClocSummary$)(params);
}
exports.createSummaryClocNewProcess = createSummaryClocNewProcess;
function paramsFromConfig(config) {
    const clocParams = {
        folderPath: config.repoFolderPath,
        outDir: config.outDir,
        outClocFile: config.outClocFile,
        outClocFilePrefix: config.outClocFilePrefix,
        clocDefsPath: config.clocDefsPath,
    };
    return clocParams;
}
exports.paramsFromConfig = paramsFromConfig;
function buildClocOutfile(config) {
    return _buildClocOutfile(config, '-cloc.csv');
}
exports.buildClocOutfile = buildClocOutfile;
function buildSummaryClocOutfile(config) {
    return _buildClocOutfile(config, '-cloc-summary.csv');
}
exports.buildSummaryClocOutfile = buildSummaryClocOutfile;
function _buildClocOutfile(config, endPart) {
    const outDir = config.outDir ? config.outDir : read_git_1.DEFAULT_OUT_DIR;
    const outFile = (0, read_git_1.getOutfileName)(config.outClocFile, config.outClocFilePrefix, config.repoFolderPath, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}
// returns the summary produced by cloc in the form of an array of strings in csv format
function clocSummaryInfo(repoFolderPath, _outDir = '', _clocDefsPath) {
    return (0, cloc_functions_1.clocSummaryCsvRaw$)(repoFolderPath);
}
exports.clocSummaryInfo = clocSummaryInfo;
//# sourceMappingURL=cloc.js.map