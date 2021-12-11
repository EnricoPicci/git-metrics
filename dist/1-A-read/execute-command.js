"use strict";
// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommandInShellNewProcessObs = exports.executeCommandNewProcessToLinesObs = exports.executeCommandNewProcessObs = exports.executeCommandObs = exports.executeCommand = void 0;
const child_process_1 = require("child_process");
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
function executeCommandObs(action, command) {
    return new rxjs_1.Observable((subscriber) => {
        console.log(`====>>>> Action: ${action} -- Executing command with Observable`);
        console.log(`====>>>> ${command}`);
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                subscriber.error(error);
            }
            else if (stderr.length > 0) {
                subscriber.error(stderr);
            }
            else {
                subscriber.next(stdout);
                subscriber.complete();
                console.log(`====>>>> Command executed successfully`);
            }
        });
    });
}
exports.executeCommandObs = executeCommandObs;
function executeCommandNewProcessObs(action, command, args, options) {
    return new rxjs_1.Observable((subscriber) => {
        console.log(`====>>>> Action: ${action} -- Executing command in new process`);
        console.log(`====>>>> Command: ${command}`);
        console.log(`====>>>> Arguments: ${args.join(' ')}`);
        if (options) {
            console.log(`====>>>> Options: ${JSON.stringify(options)}`);
        }
        const cmd = (0, child_process_1.spawn)(command, args.filter((a) => a.length > 0), options);
        cmd.stdout.on('data', (data) => {
            subscriber.next(data);
        });
        cmd.stderr.on('data', (data) => {
            console.log(`msg on stderr for command ${command}`, data.toString());
        });
        cmd.on('error', (error) => {
            subscriber.error(error);
        });
        cmd.on('close', (code) => {
            subscriber.complete();
            console.log(`====>>>> Command ${command} with args ${args} executed successfully - exit code ${code}`);
        });
    });
}
exports.executeCommandNewProcessObs = executeCommandNewProcessObs;
function executeCommandNewProcessToLinesObs(action, command, args, options) {
    return executeCommandNewProcessObs(action, command, args, options).pipe(dataToLines());
}
exports.executeCommandNewProcessToLinesObs = executeCommandNewProcessToLinesObs;
function dataToLines() {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let remainder = '';
            const subscription = source.subscribe({
                next: (buffer) => {
                    const bufferWithRemainder = `${remainder}${buffer}`;
                    const lines = bufferWithRemainder.toString().split('\n');
                    remainder = lines.splice(lines.length - 1)[0];
                    lines.forEach((l) => subscriber.next(l));
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    subscriber.next(remainder);
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
function executeCommandInShellNewProcessObs(action, command, options) {
    const _options = Object.assign(Object.assign({}, options), { shell: true });
    return executeCommandNewProcessObs(action, command, [], _options);
}
exports.executeCommandInShellNewProcessObs = executeCommandInShellNewProcessObs;
//# sourceMappingURL=execute-command.js.map