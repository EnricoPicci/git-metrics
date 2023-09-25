"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummaryStream = exports.clocSummaryInfo = exports.createMultiClocLogs = exports.buildSummaryClocOutfile = exports.buildClocOutfile = exports.createSummaryClocNewProcess = exports.streamSummaryClocNewProcess = exports.createSummaryClocLog = exports.createClocLogNewProcess = exports.streamClocNewProcess = exports.createClocLog = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const execute_command_1 = require("../../../tools/execute-command/execute-command");
const config_1 = require("../0-config/config");
const read_git_1 = require("./read-git");
const cloc_functions_1 = require("../../../cloc-functions/cloc.functions");
function createClocLog(config, action) {
    const clocParams = {
        folderPath: config.repoFolderPath,
        outDir: config.outDir,
        outClocFile: config.outClocFile,
        outClocFilePrefix: config.outClocFilePrefix,
        clocDefsPath: config.clocDefsPath,
        useNpx: true,
    };
    return (0, cloc_functions_1.writeClocByfile)(clocParams, action);
}
exports.createClocLog = createClocLog;
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function streamClocNewProcess(config, action) {
    const clocParams = {
        folderPath: config.repoFolderPath,
        outDir: config.outDir,
        outClocFile: config.outClocFile,
        outClocFilePrefix: config.outClocFilePrefix,
        clocDefsPath: config.clocDefsPath,
        useNpx: true,
    };
    return (0, cloc_functions_1.streamClocByfile)(clocParams, action, true);
}
exports.streamClocNewProcess = streamClocNewProcess;
function createClocLogNewProcess(config, action = 'cloc') {
    const [cmd, out] = clocCommand(config);
    return (0, execute_command_1.executeCommandInShellNewProcessObs)(action, cmd).pipe((0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(out), (0, rxjs_1.tap)({
        next: (outFile) => {
            console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
            console.log(`====>>>> cloc info saved on file ${outFile}`);
        },
    }));
}
exports.createClocLogNewProcess = createClocLogNewProcess;
function createSummaryClocLog(config, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
exports.createSummaryClocLog = createSummaryClocLog;
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function streamSummaryClocNewProcess(config, outFile, action, writeFileOnly = false) {
    const { cmd, args, options } = clocSummaryCommandWithArgs(config);
    const _cloc = (0, execute_command_1.executeCommandNewProcessToLinesObs)(action, cmd, args, options).pipe(_filterClocHeader('files,language,blank,comment,code'), (0, rxjs_1.share)());
    const emitOutFileOrIgnoreElements = writeFileOnly
        ? (0, rxjs_1.pipe)((0, rxjs_1.last)(), (0, rxjs_1.map)(() => outFile))
        : (0, rxjs_1.ignoreElements)();
    const _writeFile = (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }), (0, rxjs_1.concatMap)(() => _cloc), (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), emitOutFileOrIgnoreElements);
    const _streams = [_writeFile];
    if (!writeFileOnly) {
        _streams.push(_cloc);
    }
    return (0, rxjs_1.merge)(..._streams);
}
exports.streamSummaryClocNewProcess = streamSummaryClocNewProcess;
function createSummaryClocNewProcess(config, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);
    return (0, execute_command_1.executeCommandInShellNewProcessObs)(action, cmd).pipe((0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(out), (0, rxjs_1.tap)({
        next: (outFile) => {
            console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
            console.log(`====>>>> cloc info saved on file ${outFile}`);
        },
    }));
}
exports.createSummaryClocNewProcess = createSummaryClocNewProcess;
function buildClocOutfile(config) {
    return _buildClocOutfile(config, '-cloc.csv');
}
exports.buildClocOutfile = buildClocOutfile;
function buildSummaryClocOutfile(config) {
    return _buildClocOutfile(config, '-summary-cloc.csv');
}
exports.buildSummaryClocOutfile = buildSummaryClocOutfile;
function _buildClocOutfile(config, endPart) {
    const outDir = config.outDir ? config.outDir : read_git_1.DEFAULT_OUT_DIR;
    const outFile = (0, read_git_1.getOutfileName)(config.outClocFile, config.outClocFilePrefix, config.repoFolderPath, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}
function _filterClocHeader(startToken) {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let startOutput = false;
            const subscription = source.subscribe({
                next: (line) => {
                    startOutput = startOutput || line.includes(startToken);
                    if (startOutput) {
                        subscriber.next(line);
                    }
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
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
    const out = buildClocOutfile(config);
    // npx cloc . --by-file --csv --out=<outFile>
    const { cmd, args } = clocCommandwWithArgs(config, out);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    return [`cd ${config.repoFolderPath} && ${cmdWithArgs}`, out];
}
function clocCommandwWithArgs(config, outFile) {
    const { cmd, args, options } = clocSummaryCommandWithArgs(config, outFile);
    args.push('--by-file');
    return { cmd, args, options };
}
function clocSummaryCommand(config) {
    const out = buildSummaryClocOutfile(config);
    // npx cloc . --csv --out=<outFile>
    const { cmd, args } = clocSummaryCommandWithArgs(config, out);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    return [`cd ${config.repoFolderPath} && ${cmdWithArgs}`, out];
}
function clocSummaryCommandWithArgs(config, outFile) {
    const args = ['cloc', '.', '--vcs=git', '--csv', clocDefsPath(config), `--timeout=${config_1.DEFAUL_CONFIG.CLOC_TIMEOUT}`];
    if (outFile) {
        const outArg = `--out=${outFile}`;
        args.push(outArg);
    }
    const options = { cwd: config.repoFolderPath };
    return { cmd: 'npx', args, options };
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
    return clocSummaryStream(clocSummaryLogPath);
}
function clocSummaryStream(clocSummaryLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            console.log(`!!!!!!!! file ${clocSummaryLogPath} not found`);
            return (0, rxjs_1.of)([]);
        }
        throw err;
    }));
}
exports.clocSummaryStream = clocSummaryStream;
//# sourceMappingURL=cloc.js.map