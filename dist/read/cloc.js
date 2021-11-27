"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.txt'  > ./test-data/output/git-repo.log
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummary = exports.clocFileDict = exports.createMultiClocLogs = exports.createSummaryClocLog = exports.createClocLog = void 0;
const path = require("path");
const operators_1 = require("rxjs/operators");
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
function createSummaryClocLog(config, action) {
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
    const out = path.join(outDir, outFile);
    // npx cloc . --by-file --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --by-file --csv ${clocDefsPath(config)} --out=${out}`,
        out,
    ];
}
function clocSummaryCommand(config) {
    const outDir = config.outDir ? config.outDir : read_git_1.DEFAULT_OUT_DIR;
    const outSummaryClocFile = (0, read_git_1.getOutfileName)(config.outClocFile, null, config.repoFolderPath, '-summary-cloc.csv');
    const out = path.join(outDir, outSummaryClocFile);
    // npx cloc . --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --csv ${clocDefsPath(config)}--out=${out}`,
        out,
    ];
}
function clocDefsPath(config) {
    return config.clocDefsPath ? `--force-lang-def=${config.clocDefsPath} ` : '';
}
// creates a dictionary where the key is the file path and the value is the ClocInfo for that file
function clocFileDict(clocLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocLogPath).pipe(
    // remove the first line which contains the csv header
    (0, operators_1.map)((lines) => lines.slice(1)), 
    // remove the last line which contains the total
    (0, operators_1.map)((lines) => lines.slice(0, lines.length - 1)), (0, operators_1.map)((lines) => lines.reduce((dict, line) => {
        const clocInfo = line.trim().split(',');
        if (clocInfo.length !== 5) {
            throw new Error(`Format of cloc line not as expected: ${line} - cloc log file ${clocLogPath}`);
        }
        const [language, filename, blank, comment, code] = clocInfo;
        if (filename.length < 3 || filename.slice(0, 2) !== './') {
            // the log file produced by the command build by the "clocCommand" function should all have the path starting with "./"
            // the path info contained in the commits of git do not have this "./"
            throw new Error(`all lines in the cloc log ${clocLogPath} should start with "./" - one does not: ${filename}`);
        }
        if (dict[filename]) {
            throw new Error(`File ${filename} present more than once in cloc log ${clocLogPath}`);
        }
        dict[filename] = {
            language,
            filename,
            blank: parseInt(blank),
            comment: parseInt(comment),
            code: parseInt(code),
        };
        return dict;
    }, {})), (0, operators_1.tap)({
        next: (dict) => {
            console.log(`====>>>> cloc info read for ${Object.keys(dict).length} files from ${clocLogPath}`);
        },
    }));
}
exports.clocFileDict = clocFileDict;
// returns the summary produced by cloc in the form of an array of strings in csv format
function clocSummary(config, action) {
    const clocSummaryLogPath = createSummaryClocLog(config, action);
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath);
}
exports.clocSummary = clocSummary;
//# sourceMappingURL=cloc.js.map