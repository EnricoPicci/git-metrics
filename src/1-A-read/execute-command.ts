// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3

import { execSync, exec, spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { Observable, Subscriber } from 'rxjs';

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

export function executeCommandObs(action: string, command: string) {
    return new Observable((subscriber: Subscriber<string>) => {
        console.log(`====>>>> Action: ${action} -- Executing command with Observable`);
        console.log(`====>>>> ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                subscriber.error(error);
            } else if (stderr.length > 0) {
                subscriber.error(stderr);
            } else {
                subscriber.next(stdout);
                subscriber.complete();
                console.log(`====>>>> Command executed successfully`);
            }
        });
    });
}

export function executeCommandNewProcessObs(
    action: string,
    command: string,
    args: string[],
    options?: SpawnOptionsWithoutStdio,
) {
    return new Observable((subscriber: Subscriber<Buffer>) => {
        console.log(`====>>>> Action: ${action} -- Executing command in new process`);
        console.log(`====>>>> Command: ${command}`);
        console.log(`====>>>> Arguments: ${args.join(' ')}`);
        if (options) {
            console.log(`====>>>> Options: ${JSON.stringify(options)}`);
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
            subscriber.error(error);
        });
        cmd.on('close', (code) => {
            subscriber.complete();
            console.log(`====>>>> Command ${command} with args ${args} executed successfully - exit code ${code}`);
        });
    });
}
export function executeCommandNewProcessToLinesObs(
    action: string,
    command: string,
    args: string[],
    options?: SpawnOptionsWithoutStdio,
) {
    return executeCommandNewProcessObs(action, command, args, options).pipe(dataToLines());
}
function dataToLines() {
    return (source: Observable<Buffer>) => {
        return new Observable((subscriber: Subscriber<string>) => {
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

export function executeCommandInShellNewProcessObs(
    action: string,
    command: string,
    options?: SpawnOptionsWithoutStdio,
) {
    const _options = { ...options, shell: true };
    return executeCommandNewProcessObs(action, command, [], _options);
}
