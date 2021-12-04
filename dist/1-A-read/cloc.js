"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummaryStream = exports.clocSummaryInfo = exports.createMultiClocLogs = exports.createSummaryClocLog = exports.createClocLog = void 0;
const path = require("path");
const observable_fs_1 = require("observable-fs");
const execute_command_1 = require("./execute-command");
const read_git_1 = require("./read-git");
function createClocLog(config, action) {
    const [cmd, out] = clocCommand(config);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
exports.createClocLog = createClocLog;
function createSummaryClocLog(config, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
exports.createSummaryClocLog = createSummaryClocLog;
// executes cloc command on all the repos and returns the array of the file names containing the cloc results (one file per repo)
// I can not use the async concurrent method (used with multi read of git) since apparently the factthat i download cloc via npx
// does not work with async Observables
function createMultiClocLogs(config, action) {
    const repoFolderPaths = config.repoFolderPaths;
    const basicConfig = Object.assign({}, config);
    delete basicConfig.repoFolderPaths;
    return repoFolderPaths
        .map((repoFolderPath) => {
        const readSingleClocConfig = Object.assign({ repoFolderPath }, basicConfig);
        return readSingleClocConfig;
    })
        .reduce((outFiles, config) => {
        const outFile = createClocLog(config, action);
        outFiles.push(outFile);
        return outFiles;
    }, []);
}
exports.createMultiClocLogs = createMultiClocLogs;
function clocCommand(config) {
    const outDir = config.outDir ? config.outDir : read_git_1.DEFAULT_OUT_DIR;
    const outFile = (0, read_git_1.getOutfileName)(config.outClocFile, config.outClocFilePrefix, config.repoFolderPath, '-cloc.csv');
    const out = path.resolve(path.join(outDir, outFile));
    // npx cloc . --by-file --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --by-file --csv ${clocDefsPath(config)} --out=${out}`,
        out,
    ];
}
function clocSummaryCommand(config) {
    const outDir = config.outDir ? config.outDir : read_git_1.DEFAULT_OUT_DIR;
    const outSummaryClocFile = (0, read_git_1.getOutfileName)(config.outClocFile, null, config.repoFolderPath, '-summary-cloc.csv');
    const out = path.resolve(path.join(outDir, outSummaryClocFile));
    // npx cloc . --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --csv ${clocDefsPath(config)}--out=${out}`,
        out,
    ];
}
function clocDefsPath(config) {
    return config.clocDefsPath ? `--force-lang-def=${config.clocDefsPath} ` : '';
}
// returns the summary produced by cloc in the form of an array of strings in csv format
function clocSummaryInfo(repoFolderPath, outDir, clocDefsPath) {
    const config = {
        repoFolderPath,
        outDir,
        clocDefsPath,
    };
    return clocSummary(config, 'clocSummaryInfo');
}
exports.clocSummaryInfo = clocSummaryInfo;
function clocSummary(config, action) {
    const clocSummaryLogPath = createSummaryClocLog(config, action);
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath);
}
function clocSummaryStream(clocSummaryLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath);
}
exports.clocSummaryStream = clocSummaryStream;
//# sourceMappingURL=cloc.js.map