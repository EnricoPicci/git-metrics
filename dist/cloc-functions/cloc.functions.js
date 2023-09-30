"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOutfileName = exports.clocByfile$ = exports.writeClocByFile$ = exports.writeClocByfile = exports.writeClocSummary$ = exports.writeClocSummary = exports.clocSummaryOnGitRepo$ = exports.clocSummaryCsvRaw$ = exports.clocSummary$ = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
const config_1 = require("./config");
/**
 * Runs the cloc command with the summary option and returns the result in the form of a stream emitting one
 * ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param path The path to run the cloc command on. Defaults to the current directory.
 * @param vcs An optional version control system to use with the cloc command.
 * @param outfile An optional file path to write the output of the cloc command to.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
function clocSummary$(path = './', vcs, outfile = '') {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    return clocSummaryCsvRaw$(path, _vcs).pipe((0, rxjs_1.concatMap)((output) => {
        return outfile ?
            (0, observable_fs_1.writeFileObs)(outfile, output).pipe((0, rxjs_1.map)(() => output)) :
            (0, rxjs_1.of)(output);
    }), (0, rxjs_1.map)((output) => {
        // remove the first line since it contains the header
        const lines = output.slice(1);
        const clocStatsArray = [];
        lines.forEach(line => {
            if (line.trim().length === 0) {
                return;
            }
            // fields are the split of 'files,language,blank,comment,code'
            const fields = line.split(',');
            const files = fields[0];
            const language = fields[1];
            const blank = fields[2];
            const comment = fields[3];
            const code = fields[4];
            const langStats = {
                language,
                nFiles: parseInt(files),
                blank: parseInt(blank),
                comment: parseInt(comment),
                code: parseInt(code),
            };
            clocStatsArray.push(langStats);
        });
        return clocStatsArray;
    }));
}
exports.clocSummary$ = clocSummary$;
/**
 * Runs the cloc command with the summary option and returns the result in CSV format as an array of lines.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param path The path to run the cloc command on. Defaults to the current directory.
 * @param vcs An optional version control system to use with the cloc command.
 * @returns An Observable that emits an array of strings, each containing the CSV-formatted cloc summary info.
 */
function clocSummaryCsvRaw$(path = './', vcs) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    const executable = config_1.CLOC_CONFIG.USE_NPX ? 'npx cloc' : 'cloc';
    return (0, execute_command_1.executeCommandObs)('run cloc summary', `${executable} --csv ${_vcs} --timeout=${config_1.CLOC_CONFIG.TIMEOUT} ${path}`).pipe((0, rxjs_1.map)(output => {
        return output.split('\n');
    }));
}
exports.clocSummaryCsvRaw$ = clocSummaryCsvRaw$;
/**
 * Runs the cloc command on a Git repository and returns the result in the form of a stream of one ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param repoPath The path to the Git repository to run the cloc command on. Defaults to the current directory.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
function clocSummaryOnGitRepo$(repoPath = './') {
    return clocSummary$(repoPath, 'git');
}
exports.clocSummaryOnGitRepo$ = clocSummaryOnGitRepo$;
/**
 * Runs the cloc command and writes the result to a file.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns The name of the file where the cloc info is saved.
 */
function writeClocSummary(params, action = 'writeClocS-cloc-summary.csvummary') {
    const [cmd, out] = clocSummaryCommand(params);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`);
    console.log(`====>>>> cloc summary info saved on file ${out}`);
    return out;
}
exports.writeClocSummary = writeClocSummary;
/**
 * Runs the cloc command with the summary option and writes the result to a file.
 * The result is a summary in the sense that it shows results per language but not per file.
 * Notifies the name of the file where the cloc info is saved once the cloc command execution is finished.
 * @param params The parameters to pass to the cloc command, including the folder path and VCS to use.
 * @returns An Observable that emits no elements but completes when the cloc command execution is finished.
 */
function writeClocSummary$(params) {
    const folderPath = params.folderPath;
    const vcs = params.vcs;
    const outFile = buildClocOutfile(params, '-cloc-summary.csv');
    return clocSummary$(folderPath, vcs, outFile).pipe((0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFile));
}
exports.writeClocSummary$ = writeClocSummary$;
/**
 * Runs the cloc command with the by-file option and writes the result to a file.
 * The result is per file, showing the number of lines in each file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns The name of the file where the cloc info is saved.
 */
function writeClocByfile(params, action = 'writeClocByFile') {
    const [cmd, out] = clocByFileCommand(params);
    (0, execute_command_1.executeCommand)(action, cmd);
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`);
    console.log(`====>>>> cloc by file info saved on file ${out}`);
    return out;
}
exports.writeClocByfile = writeClocByfile;
/**
 * Runs the cloc command with the by-file option and writes the result to a file.
 * Notifies the name of the file where the cloc info is saved once the cloc command execution is finished.
 * The result is per file, showing the number of lines in each file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns An Observable that emits the name of the file written once the cloc command execution is finished.
 */
function writeClocByFile$(params, action = 'cloc') {
    const [cmd, out] = clocByFileCommand(params);
    return (0, execute_command_1.executeCommandInShellNewProcessObs)(action, cmd).pipe((0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(out), (0, rxjs_1.tap)({
        next: (outFile) => {
            console.log(`====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`);
            console.log(`====>>>> cloc info saved on file ${outFile}`);
        },
    }));
}
exports.writeClocByFile$ = writeClocByFile$;
/**
 * Executes the cloc command in a new process and returns the stream of lines output of the cloc command execution.
 * The result is per file, showing the number of lines in each file.
 * If `writeFile` is true, then the output of the cloc command will be written to a file with a name based on the
 * provided parameters.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @param writeFile Whether or not to write the output of the cloc command to a file (the file name is derived from the params).
 * @returns An Observable that emits the lines output of the cloc command execution.
 */
function clocByfile$(params, action, writeFile = true) {
    // execute the cloc command in a new process and return the stream of lines output of the cloc command execution
    const { cmd, args, options } = clocByfileCommandWithArgs(params);
    const _cloc = (0, execute_command_1.executeCommandNewProcessToLinesObs)(action, cmd, args, options).pipe(ignoreUpTo('language,filename,blank,comment,code'), (0, rxjs_1.share)());
    // if writeFile is true, then calculate the name of the output file
    let outFile = writeFile ? buildClocOutfile(params, '-cloc.csv') : '';
    // create an Observable that deletes the output file if it exists and then takes the cloc strem
    // and appends each line to the output file
    const _writeFile = (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }), (0, rxjs_1.concatMap)(() => _cloc), (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), 
    // we are not interested in the output of this stream, since this stream is triggered only if writeFile is true
    // regardless of the value of writeFile, we want are going to trigger the _cloc stream with the merge function below
    // therefore, the cloc stream will be triggered regardless of the value of writeFile and will always emit
    // what is produced by the cloc command, hence we must ignore the output of this stream (otherwise we would 
    // have duplicate output)
    (0, rxjs_1.ignoreElements)());
    const _streams = [_cloc];
    // if writeFile is true, then add the _writeFile stream to the streams array
    if (writeFile) {
        _streams.push(_writeFile);
    }
    // merge the streams and return the merged stream
    // if writeFile is false then the merged stream will be the _cloc stream
    // if writeFile is true then the merged stream will be the _cloc stream and the output file will be written
    // silently in the background without the emissione of any value since we have used the ignoreElements operator
    return (0, rxjs_1.merge)(..._streams);
}
exports.clocByfile$ = clocByfile$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
function clocCommand(params) {
    // npx cloc . --vcs=git --csv  --timeout=1000000
    const cd = `cd ${params.folderPath}`;
    const program = config_1.CLOC_CONFIG.USE_NPX ? 'npx cloc' : 'cloc';
    const clocDefPath = params.clocDefsPath ? `--force-lang-def=${params.clocDefsPath}` : '';
    const cmd = `${cd} && ${program} . --vcs=git --csv ${clocDefPath} --timeout=${config_1.CLOC_CONFIG.TIMEOUT}`;
    return cmd;
}
function clocSummaryCommand(params) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv
    const out = buildClocOutfile(params, '-cloc-summary.csv');
    const cmd = clocCommand(params) + ` --out=${out}`;
    return [cmd, out];
}
function clocByFileCommand(params) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv --by-file
    const out = buildClocOutfile(params, '-cloc-byfile.csv');
    let cmd = clocCommand(params) + ` --out=${out}`;
    cmd = cmd + ' --by-file';
    return [cmd, out];
}
function buildClocOutfile(config, endPart) {
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outClocFile, config.folderPath, config.outClocFilePrefix, endPart);
    const out = path_1.default.resolve(path_1.default.join(outDir, outFile));
    return out;
}
/**
 * Generates an output file name based on the provided parameters.
 * If an `outFile` parameter is provided, it will be used as the output file name.
 * Otherwise, the output file name will be generated based on the `prefix`, `folder`, and `postfix` parameters.
 * If `prefix` is provided, it will be used as a prefix for the output file name.
 * If `repoFolder` is provided, it will be used as the base folder name for the output file name.
 * If `postfix` is provided, it will be appended to the end of the output file name.
 * If `repoFolder` is not provided or is an empty string, the current working directory name will be used as the base folder name.
 * @param outFile The desired output file name.
 * @param repoFolder An optional base folder name for the output file name.
 * @param prefix An optional prefix for the output file name.
 * @param postfix An optional postfix for the output file name.
 * @returns The generated output file name.
 */
function buildOutfileName(outFile = '', repoFolder = '', prefix, postfix) {
    const repoFolderName = path_1.default.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path_1.default.parse(process.cwd()).name : repoFolderName;
    const _prefix = prefix !== null && prefix !== void 0 ? prefix : '';
    const _postfix = postfix !== null && postfix !== void 0 ? postfix : '';
    return outFile ? outFile : `${_prefix}${(_repoFolderName)}${_postfix}`;
}
exports.buildOutfileName = buildOutfileName;
function clocByfileCommandWithArgs(params) {
    const args = ['cloc', '.', '--vcs=git', '--csv', `--timeout=${config_1.CLOC_CONFIG.TIMEOUT}`, '--by-file'];
    const options = { cwd: params.folderPath };
    const cmd = config_1.CLOC_CONFIG.USE_NPX ? 'npx' : 'cloc';
    return { cmd, args, options };
}
/**
 * Returns an operator function that filters the input Observable to only include lines of text
 * that come after the line that includes the specified start token.
 * @param startToken The start token to look for in the input stream.
 * @returns An operator function that filters the input Observable.
 */
function ignoreUpTo(startToken) {
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
//# sourceMappingURL=cloc.functions.js.map