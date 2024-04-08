import { expect } from 'chai';
import { deleteFileObs, readLinesObs } from 'observable-fs';
import { catchError, concatMap, defaultIfEmpty, of, tap } from 'rxjs';
import {
    executeCommand,
    executeCommandInShellNewProcessObs,
    executeCommandNewProcessObs,
    executeCommandNewProcessToLinesObs,
    executeCommandObs$,
} from './execute-command';

describe(`When executing a command`, () => {
    it(`returns the console output if the command is correct`, () => {
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        const ret = executeCommand('Test-1', cmd);
        expect(typeof ret).equal('string');
        expect(ret.length).gt(0);
    });
    it(`raises an exce[tion if the command is wrong`, () => {
        let err: Error | undefined = undefined;
        try {
            executeCommand('Test-12', 'NotACommand');
        } catch (e: any) {
            err = e;
        } finally {
            expect(err).not.undefined;
        }
    });
});

describe(`When executing a command with executeCommandObs (i.e. async)`, () => {
    it(`the data notified by the observable contains something`, (done) => {
        let dataReceived: string;
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        executeCommandObs$('Test-1', cmd).subscribe({
            next: (data) => {
                dataReceived = data;
                expect(data.length).gt(0);
            },
            error: (err) => {
                done(`should not arrive here with error: ${err}`);
            },
            complete: () => {
                done();
                expect(dataReceived.length).gt(0);
            },
        });
    });
    it(`the Observable errors if the command is wrong`, (done) => {
        executeCommandObs$('Test-12', 'NotACommand').subscribe({
            next: (data) => {
                done(`should not arrive here with data: ${data}`);
            },
            error: (err) => {
                expect(err).not.undefined;
                done();
            },
            complete: () => {
                done(`should not arrive here since it should error`);
            },
        });
    });
});

describe(`executeCommandNewProcessObs`, () => {
    it(`the data notified is of type Buffer`, (done) => {
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        const args = process.platform === 'win32' ? [] : ['-l'];
        executeCommandNewProcessObs('Test-1', cmd, args).subscribe({
            next: (data) => {
                expect(data).not.undefined;
                expect(data instanceof Buffer).true;
            },
            error: (err) => {
                done(`should not arrive here with error: ${err}`);
            },
            complete: () => {
                done();
            },
        });
    });
});

describe(`executeCommandNewProcessToLinesObs`, () => {
    it(`the data notified is of type string`, (done) => {
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        const args = process.platform === 'win32' ? [] : ['-l'];
        executeCommandNewProcessToLinesObs('Test-1', cmd, args).subscribe({
            next: (data) => {
                expect(data).not.undefined;
                expect(typeof data).equal('string');
            },
            error: (err) => {
                done(`should not arrive here with error: ${err}`);
            },
            complete: () => {
                done();
            },
        });
    });
});

describe(`executeCommandInShellNewProcessObs`, () => {
    it(`execute the command in a shell`, (done) => {
        const outFile = `./temp/abc.txt`;
        const cmd = process.platform === 'win32' ? `dir > ${outFile}` : `ls -l > ${outFile}`;

        const defaultIfEmptyValue = 'The only value notified';
        let numberOfNotifications = 0;

        deleteFileObs(outFile)
            .pipe(
                catchError((err) => {
                    if (err.code === 'ENOENT') {
                        return of(null);
                    }
                    throw new Error(err);
                }),
                concatMap(() => executeCommandInShellNewProcessObs('Test-2', cmd)),
                defaultIfEmpty(defaultIfEmptyValue),
                tap({
                    next: (valueNotified) => {
                        numberOfNotifications++;
                        expect(valueNotified).equal(defaultIfEmptyValue);
                    },
                    error: (err) => {
                        done(`should not arrive here with error: ${err}`);
                    },
                    complete: () => {
                        expect(numberOfNotifications).equal(1);
                        done();
                    },
                }),
                concatMap(() => {
                    return readLinesObs(outFile);
                }),
                tap({
                    next: (lines) => {
                        expect(lines.length).gt(0);
                    },
                }),
            )
            .subscribe();
    });
});
