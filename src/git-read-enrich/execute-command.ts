// https://gist.github.com/wosephjeber/212f0ca7fea740c3a8b03fc2283678d3

import { execSync, exec } from 'child_process';
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
