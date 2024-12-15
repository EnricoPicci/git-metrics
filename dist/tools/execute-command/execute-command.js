"use strict";
// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommandInShellNewProcessObs = exports.executeCommandNewProcessToLinesObs = exports.executeCommandNewProcessObs = exports.writeCmdLogs$ = exports.executeCommandObs$ = exports.executeCommand = void 0;
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const child_process_1 = require("child_process");
const observable_fs_1 = require("observable-fs");
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function executeCommand(action, command) {
    console.log(`====>>>> Action: ${action} -- Executing command`);
    console.log(`====>>>> ${command}`);
    const ret = (0, child_process_1.execSync)(command)
        .toString('utf8')
        .replace(/[\n\r\s]+$/, '');
    console.log(`====>>>> Command executed successfully`);
    return ret;
}
exports.executeCommand = executeCommand;
/**
 * Executes a shell command and returns an Observable that emits the standard output of the command.
 * If the command sends any output to the standard error stream, the stdErrorHandler function is called with the standard error output.
 * Such function can return an Error object to notify the error or null to ignore the error.
 * @param action A string describing the action being performed by the command.
 * @param command The shell command to execute.
 * @param stdErrorHandler An optional error handler function that takes the standard error output of the command
 * and returns an Error object or null.
 * @returns An Observable that emits the standard output of the command.
 * @throws An error if the command execution fails or if the stdErrorHandler function returns an Error object.
 */
function executeCommandObs$(action, command, options) {
    return new rxjs_1.Observable((subscriber) => {
        var _a;
        console.log(`====>>>> Action: ${action} -- Executing command with Observable`);
        console.log(`====>>>> ${command}`);
        (_a = options === null || options === void 0 ? void 0 : options.cmdExecutedLog) === null || _a === void 0 ? void 0 : _a.push({ command });
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            var _a, _b, _c;
            if (error) {
                (_a = options === null || options === void 0 ? void 0 : options.cmdErroredLog) === null || _a === void 0 ? void 0 : _a.push({ command, message: error.message });
                subscriber.error(error);
                return;
            }
            if (stderr.length > 0) {
                const stdErrorHandler = (_b = options === null || options === void 0 ? void 0 : options.stdErrorHandler) !== null && _b !== void 0 ? _b : ((stderr) => {
                    console.log(`!!!!!!!! Message on stadard error:\n${stderr}`);
                    return null;
                });
                const notifyError = stdErrorHandler(stderr);
                if (notifyError) {
                    (_c = options === null || options === void 0 ? void 0 : options.cmdErroredLog) === null || _c === void 0 ? void 0 : _c.push({ command, message: notifyError.message });
                    subscriber.error(notifyError);
                    return;
                }
            }
            console.log(`====>>>>$$$ Command "${command}" executed successfully`);
            subscriber.next(stdout);
            subscriber.complete();
        });
    });
}
exports.executeCommandObs$ = executeCommandObs$;
function writeCmdLogs$(options, outDir) {
    var _a;
    const cmdExecutedLog = options.cmdExecutedLog;
    const cmdErroredLog = options.cmdErroredLog;
    let prefix = (_a = options.filePrefix) !== null && _a !== void 0 ? _a : '';
    // if prefix does not end with a dash, we add it
    if (!prefix.endsWith('-')) {
        prefix = `${prefix}-`;
    }
    // timestamp in the format YYYY-MM-DDThh:mm:ss.mmmZ to be used as postfix in the file names
    const timestamp = new Date().toISOString();
    // if the caller provided the cmdExecutedLog and cmdErroredLog arrays, we transform the
    // entries in the arrays to csv strings and write them to files
    let writeCmdExecutedLog$ = (0, rxjs_1.of)('');
    if (cmdExecutedLog && cmdExecutedLog.length > 0) {
        const cmdExecutedCsv = cmdExecutedLog.map(c => c.command);
        writeCmdExecutedLog$ = (0, observable_fs_1.writeFileObs)(path_1.default.join(outDir, `${prefix}cmd-executed-${timestamp}.log`), cmdExecutedCsv);
    }
    let writeCmdErroredLog$ = (0, rxjs_1.of)('');
    if (cmdErroredLog && cmdErroredLog.length > 0) {
        const cmdErroredCsv = (0, csv_tools_1.toCsv)(cmdErroredLog);
        writeCmdErroredLog$ = (0, observable_fs_1.writeFileObs)(path_1.default.join(outDir, `${prefix}cmd-errored-${timestamp}.log`), cmdErroredCsv);
    }
    return (0, rxjs_1.forkJoin)([writeCmdExecutedLog$, writeCmdErroredLog$]).pipe((0, rxjs_1.map)((resp) => {
        const [cmdExecutedFile, cmdErroredFile] = resp;
        if (cmdExecutedFile) {
            console.log(`====>>>> cmdExecutedLog written in file: ${cmdExecutedFile}`);
        }
        else {
            console.log('====>>>> No cmdExecutedLog file written');
        }
        if (cmdErroredFile) {
            console.log(`====>>>> cmdErroredLog written in file: ${cmdErroredFile}`);
        }
        else {
            console.log('====>>>> No cmdErroredLog file written');
        }
        return resp;
    }));
}
exports.writeCmdLogs$ = writeCmdLogs$;
function executeCommandNewProcessObs(action, command, args, _options, options) {
    return new rxjs_1.Observable((subscriber) => {
        console.log(`====>>>> Action: ${action} -- Executing command in new process`);
        console.log(`====>>>> Command: ${command}`);
        console.log(`====>>>> Arguments: ${args.join(' ')}`);
        if (options) {
            console.log(`====>>>> Options: ${JSON.stringify(options)}`);
        }
        if (_options === null || _options === void 0 ? void 0 : _options.cmdExecutedLog) {
            const _args = args.join(' ');
            _options.cmdExecutedLog.push({ command: `${command} ${_args}` });
        }
        const cmd = (0, child_process_1.spawn)(command, args.filter((a) => a.length > 0), options);
        cmd.stdout.on('data', (data) => {
            subscriber.next(data);
        });
        cmd.stderr.on('data', (data) => {
            console.log(`msg on stderr for command ${command}`, data.toString());
        });
        cmd.on('error', (error) => {
            if (_options === null || _options === void 0 ? void 0 : _options.cmdErroredLog) {
                _options.cmdErroredLog.push({ command: `${command} ${args.join(' ')}`, message: error.message });
            }
            subscriber.error(error);
        });
        cmd.on('close', (code) => {
            console.log(`====>>>> Command ${command} with args ${args} executed - exit code ${code}`);
            subscriber.complete();
        });
    });
}
exports.executeCommandNewProcessObs = executeCommandNewProcessObs;
// executes a command in a separate process and returns an Observable which is the stream of lines output of the command execution
function executeCommandNewProcessToLinesObs(action, command, args, _options, options) {
    return executeCommandNewProcessObs(action, command, args, _options, options).pipe(bufferToLines());
}
exports.executeCommandNewProcessToLinesObs = executeCommandNewProcessToLinesObs;
// custom operator that converts a buffer to lines, i.e. splits on \n to emit each line
function bufferToLines() {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let remainder = '';
            let started = false;
            const subscription = source.subscribe({
                next: (buffer) => {
                    started = true;
                    const bufferWithRemainder = `${remainder}${buffer}`;
                    const lines = bufferWithRemainder.toString().split('\n');
                    remainder = lines.splice(lines.length - 1)[0];
                    lines.forEach((l) => subscriber.next(l));
                },
                error: (err) => {
                    subscriber.error(err);
                },
                complete: () => {
                    if (started && remainder.length > 0) {
                        subscriber.next(remainder);
                    }
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
function executeCommandInShellNewProcessObs(action, command, _options, options) {
    const _opt = Object.assign(Object.assign({}, options), { shell: true });
    return executeCommandNewProcessObs(action, command, [], _options, _opt);
}
exports.executeCommandInShellNewProcessObs = executeCommandInShellNewProcessObs;
//# sourceMappingURL=execute-command.js.map