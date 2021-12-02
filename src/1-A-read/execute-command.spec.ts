import { expect } from 'chai';
import { executeCommand, executeCommandObs } from './execute-command';

describe(`When executing a command`, () => {
    it(`returns the console output if the command is correct`, () => {
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        const ret = executeCommand('Test-1', cmd);
        expect(typeof ret).equal('string');
        expect(ret.length).gt(0);
    });
    it(`raises an exce[tion if the command is wrong`, () => {
        let err: Error;
        try {
            executeCommand('Test-12', 'NotACommand');
        } catch (e) {
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
        executeCommandObs('Test-1', cmd).subscribe({
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
        executeCommandObs('Test-12', 'NotACommand').subscribe({
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
