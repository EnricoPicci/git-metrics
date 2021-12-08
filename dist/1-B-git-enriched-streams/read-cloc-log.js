"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toClocFileDict = exports.clocFileDict = void 0;
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
// creates a dictionary where the key is the file path and the value is the ClocInfo for that file
function clocFileDict(clocLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocLogPath).pipe(toClocFileDict(clocLogPath));
}
exports.clocFileDict = clocFileDict;
function toClocFileDict(clocLogPath) {
    const clocFileMsg = clocLogPath ? ` - cloc log file ${clocLogPath}` : '';
    return (0, rxjs_1.pipe)(
    // remove the first line which contains the csv header
    (0, rxjs_1.map)((lines) => lines.slice(1)), 
    // remove the last line which contains the total
    (0, rxjs_1.map)((lines) => {
        let sumLineIndex;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].slice(0, 3) === 'SUM') {
                sumLineIndex = i;
                break;
            }
        }
        if (sumLineIndex === undefined) {
            throw new Error(`No line with SUM found`);
        }
        return lines.slice(0, sumLineIndex);
    }), (0, rxjs_1.map)((lines) => {
        return lines.reduce((dict, line) => {
            const clocInfo = line.trim().split(',');
            if (clocInfo.length !== 5) {
                throw new Error(`Format of cloc line not as expected: ${line} ${clocFileMsg}`);
            }
            const [language, filename, blank, comment, code] = clocInfo;
            if (filename.length < 3 || filename.slice(0, 2) !== './') {
                // the log file produced by the command build by the "clocCommand" function should all have the path starting with "./"
                // the path info contained in the commits of git do not have this "./"
                throw new Error(`all lines in the cloc log should start with "./" - one does not: ${filename} ${clocFileMsg}`);
            }
            if (dict[filename]) {
                throw new Error(`File ${filename} present more than once in cloc log ${clocFileMsg}`);
            }
            dict[filename] = {
                language,
                filename,
                blank: parseInt(blank),
                comment: parseInt(comment),
                code: parseInt(code),
            };
            return dict;
        }, {});
    }), (0, rxjs_1.tap)({
        next: (dict) => {
            console.log(`====>>>> cloc info read for ${Object.keys(dict).length} ${clocFileMsg}`);
        },
    }));
}
exports.toClocFileDict = toClocFileDict;
//# sourceMappingURL=read-cloc-log.js.map