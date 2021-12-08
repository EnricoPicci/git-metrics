"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummaryStream = exports.clocSummaryInfo = exports.createMultiClocLogs = exports.buildSummaryClocOutfile = exports.buildClocOutfile = exports.createSummaryClocNewProcess = exports.createSummaryClocLog = exports.createClocNewProcess = exports.createClocLog = void 0;
const path = require("path");
const observable_fs_1 = require("observable-fs");
const execute_command_1 = require("./execute-command");
const read_git_1 = require("./read-git");
const rxjs_1 = require("rxjs");
function createClocLog(config, action) {
    const [cmd, out] = clocCommand(config);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
exports.createClocLog = createClocLog;
function createClocNewProcess(config, outFile, action) {
    const { cmd, args, options } = clocCommandwWithArgs(config);
    const _cloc = (0, execute_command_1.executeCommandNewProcessToLinesObs)(action, cmd, args, options).pipe(_filterClocHeader('language,filename,blank,comment,code'), (0, rxjs_1.share)());
    const _writeFile = (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
    }), (0, rxjs_1.concatMap)(() => _cloc), (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), (0, rxjs_1.ignoreElements)());
    return (0, rxjs_1.merge)(_cloc, _writeFile);
}
exports.createClocNewProcess = createClocNewProcess;
function createSummaryClocLog(config, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`);
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
exports.createSummaryClocLog = createSummaryClocLog;
function createSummaryClocNewProcess(config, outFile, action) {
    const { cmd, args, options } = clocSummaryCommandWithArgs(config);
    const _cloc = (0, execute_command_1.executeCommandNewProcessToLinesObs)(action, cmd, args, options).pipe(_filterClocHeader('files,language,blank,comment,code'), (0, rxjs_1.share)());
    const _writeFile = (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
    }), (0, rxjs_1.concatMap)(() => _cloc), (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), (0, rxjs_1.ignoreElements)());
    return (0, rxjs_1.merge)(_cloc, _writeFile);
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
    const args = ['cloc', '.', '--exclude-dir=node_modules', '--csv', clocDefsPath(config)];
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
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath);
}
function clocSummaryStream(clocSummaryLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocSummaryLogPath);
}
exports.clocSummaryStream = clocSummaryStream;
//# sourceMappingURL=cloc.js.map