// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3

import { toCsv } from '@enrico.piccinin/csv-tools';
import { execSync, exec, spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { writeFileObs } from 'observable-fs';
import path from 'path';
import { Observable, Subscriber, forkJoin, map, of } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function executeCommand(action: string, command: string) {
    console.log(`====>>>> Action: ${action} -- Executing command`);
    console.log(`====>>>> ${command}`);
    const ret = execSync(command)
        .toString('utf8')
        .replace(/[\n\r\s]+$/, '');
    console.log(`====>>>> Command executed successfully`);
    return ret;
}

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
export function executeCommandObs(action: string, command: string, options?: ExecuteCommandObsOptions) {
    return new Observable((subscriber: Subscriber<string>) => {
        console.log(`====>>>> Action: ${action} -- Executing command with Observable`);
        console.log(`====>>>> ${command}`);
        options?.cmdExecutedLog?.push({ command });
        exec(command, (error, stdout, stderr) => {
            if (error) {
                options?.cmdErroredLog?.push({ command, message: error.message });
                subscriber.error(error);
                return
            }
            if (stderr.length > 0) {
                const stdErrorHandler = options?.stdErrorHandler ?? ((stderr) => {
                    console.log(`!!!!!!!! Message on stadard error:\n${stderr}`)
                    return null
                });
                const notifyError = stdErrorHandler(stderr);
                if (notifyError) {
                    options?.cmdErroredLog?.push({ command, message: notifyError.message });
                    subscriber.error(notifyError);
                    return
                }
            }
            console.log(`====>>>>$$$ Command "${command}" executed successfully`);
            subscriber.next(stdout);
            subscriber.complete();
        });
    });
}

export type ExecuteCommandObsOptions = {
    stdErrorHandler?: (stderr: string) => Error | null;
    cmdExecutedLog?: CmdExecuted[];
    cmdErroredLog?: CmdErrored[];
    filePrefix: string;
}

export type CmdExecuted = { command: string }
export type CmdErrored = { command: string, message: string }
export function writeCmdLogs$(options: ExecuteCommandObsOptions, outDir: string) {
    const cmdExecutedLog = options.cmdExecutedLog;
    const cmdErroredLog = options.cmdErroredLog;
    let prefix = options.filePrefix ?? '';
    // if prefix does not end with a dash, we add it
    if (!prefix.endsWith('-')) {
        prefix = `${prefix}-`;
    }
    // if the caller provided the cmdExecutedLog and cmdErroredLog arrays, we transform the
    // entries in the arrays to csv strings and write them to files
    let writeCmdExecutedLog$ = of('');
    if (cmdExecutedLog && cmdExecutedLog.length > 0) {
        const cmdExecutedCsv = cmdExecutedLog.map(c => c.command);
        writeCmdExecutedLog$ = writeFileObs(path.join(outDir, `${prefix}cmd-executed.log`), cmdExecutedCsv)
    }
    let writeCmdErroredLog$ = of('');
    if (cmdErroredLog && cmdErroredLog.length > 0) {
        const cmdErroredCsv = toCsv(cmdErroredLog);
        writeCmdErroredLog$ = writeFileObs(path.join(outDir, `${prefix}cmd-errored.log`), cmdErroredCsv)
    }
    return forkJoin([writeCmdExecutedLog$, writeCmdErroredLog$]).pipe(
        map((resp: [cmdExecutedFile: string, cmdErroredFile: string]) => {
            const [cmdExecutedFile, cmdErroredFile] = resp;
            if (cmdExecutedFile) {
                console.log(`====>>>> cmdExecutedLog written in file: ${cmdExecutedFile}`);
            } else {
                console.log('====>>>> No cmdExecutedLog file written');
            }
            if (cmdErroredFile) {
                console.log(`====>>>> cmdErroredLog written in file: ${cmdErroredFile}`);
            } else {
                console.log('====>>>> No cmdErroredLog file written');
            }
            return resp
        })
    );
}

export function executeCommandNewProcessObs(
    action: string,
    command: string,
    args: string[],
    options?: SpawnOptionsWithoutStdio,
    _options?: ExecuteCommandObsOptions,
) {
    return new Observable((subscriber: Subscriber<Buffer>) => {
        console.log(`====>>>> Action: ${action} -- Executing command in new process`);
        console.log(`====>>>> Command: ${command}`);
        console.log(`====>>>> Arguments: ${args.join(' ')}`);
        if (options) {
            console.log(`====>>>> Options: ${JSON.stringify(options)}`);
        }

        if (_options?.cmdExecutedLog) {
            const _args = args.join(' ')
            _options.cmdExecutedLog.push({ command: `${command} ${_args}` });
        }
        const cmd = spawn(
            command,
            args.filter((a) => a.length > 0),
            options,
        );
        cmd.stdout.on('data', (data) => {
            subscriber.next(data);
        });
        cmd.stderr.on('data', (data) => {
            console.log(`msg on stderr for command ${command}`, data.toString());
        });
        cmd.on('error', (error) => {
            if (_options?.cmdErroredLog) {
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

// executes a command in a separate process and returns an Observable which is the stream of lines output of the command execution
export function executeCommandNewProcessToLinesObs(
    action: string,
    command: string,
    args: string[],
    options?: SpawnOptionsWithoutStdio,
    _options?: ExecuteCommandObsOptions,
) {
    return executeCommandNewProcessObs(action, command, args, options, _options).pipe(bufferToLines());
}

// custom operator that converts a buffer to lines, i.e. splits on \n to emit each line
function bufferToLines() {
    return (source: Observable<Buffer>) => {
        return new Observable((subscriber: Subscriber<string>) => {
            let remainder = '';
            let started = false
            const subscription = source.subscribe({
                next: (buffer) => {
                    started = true
                    const bufferWithRemainder = `${remainder}${buffer}`;
                    const lines = bufferWithRemainder.toString().split('\n');
                    remainder = lines.splice(lines.length - 1)[0];
                    lines.forEach((l) => subscriber.next(l));
                },
                error: (err) => {
                    subscriber.error(err)
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

export function executeCommandInShellNewProcessObs(
    action: string,
    command: string,
    options?: SpawnOptionsWithoutStdio,
    _options?: ExecuteCommandObsOptions,
) {
    const _opt = { ...options, shell: true };
    return executeCommandNewProcessObs(action, command, [], _opt, _options);
}
