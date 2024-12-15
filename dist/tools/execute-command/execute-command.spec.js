"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const execute_command_1 = require("./execute-command");
describe(`When executing a command`, () => {
    it(`returns the console output if the command is correct`, () => {
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        const ret = (0, execute_command_1.executeCommand)('Test-1', cmd);
        (0, chai_1.expect)(typeof ret).equal('string');
        (0, chai_1.expect)(ret.length).gt(0);
    });
    it(`raises an exce[tion if the command is wrong`, () => {
        let err = undefined;
        try {
            (0, execute_command_1.executeCommand)('Test-12', 'NotACommand');
        }
        catch (e) {
            err = e;
        }
        finally {
            (0, chai_1.expect)(err).not.undefined;
        }
    });
});
describe(`When executing a command with executeCommandObs (i.e. async)`, () => {
    it(`the data notified by the observable contains something`, (done) => {
        let dataReceived;
        const cmd = process.platform === 'win32' ? 'dir' : 'ls';
        (0, execute_command_1.executeCommandObs$)('Test-1', cmd, {}).subscribe({
            next: (data) => {
                dataReceived = data;
                (0, chai_1.expect)(data.length).gt(0);
            },
            error: (err) => {
                done(`should not arrive here with error: ${err}`);
            },
            complete: () => {
                done();
                (0, chai_1.expect)(dataReceived.length).gt(0);
            },
        });
    });
    it(`the Observable errors if the command is wrong`, (done) => {
        (0, execute_command_1.executeCommandObs$)('Test-12', 'NotACommand', {}).subscribe({
            next: (data) => {
                done(`should not arrive here with data: ${data}`);
            },
            error: (err) => {
                (0, chai_1.expect)(err).not.undefined;
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
        (0, execute_command_1.executeCommandNewProcessObs)('Test-1', cmd, args, {}).subscribe({
            next: (data) => {
                (0, chai_1.expect)(data).not.undefined;
                (0, chai_1.expect)(data instanceof Buffer).true;
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
        (0, execute_command_1.executeCommandNewProcessToLinesObs)('Test-1', cmd, args, {}).subscribe({
            next: (data) => {
                (0, chai_1.expect)(data).not.undefined;
                (0, chai_1.expect)(typeof data).equal('string');
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
        (0, observable_fs_1.deleteFileObs)(outFile)
            .pipe((0, rxjs_1.catchError)((err) => {
            if (err.code === 'ENOENT') {
                return (0, rxjs_1.of)(null);
            }
            throw new Error(err);
        }), (0, rxjs_1.concatMap)(() => (0, execute_command_1.executeCommandInShellNewProcessObs)('Test-2', cmd, {})), (0, rxjs_1.defaultIfEmpty)(defaultIfEmptyValue), (0, rxjs_1.tap)({
            next: (valueNotified) => {
                numberOfNotifications++;
                (0, chai_1.expect)(valueNotified).equal(defaultIfEmptyValue);
            },
            error: (err) => {
                done(`should not arrive here with error: ${err}`);
            },
            complete: () => {
                (0, chai_1.expect)(numberOfNotifications).equal(1);
                done();
            },
        }), (0, rxjs_1.concatMap)(() => {
            return (0, observable_fs_1.readLinesObs)(outFile);
        }), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines.length).gt(0);
            },
        }))
            .subscribe();
    });
});
//# sourceMappingURL=execute-command.spec.js.map