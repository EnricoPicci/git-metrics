"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocFileDict = void 0;
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
// creates a dictionary where the key is the file path and the value is the ClocInfo for that file
function clocFileDict(clocLogPath) {
    return (0, observable_fs_1.readLinesObs)(clocLogPath).pipe(
    // remove the first line which contains the csv header
    (0, rxjs_1.map)((lines) => lines.slice(1)), 
    // remove the last line which contains the total
    (0, rxjs_1.map)((lines) => lines.slice(0, lines.length - 1)), (0, rxjs_1.map)((lines) => lines.reduce((dict, line) => {
        const clocInfo = line.trim().split(',');
        if (clocInfo.length !== 5) {
            throw new Error(`Format of cloc line not as expected: ${line} - cloc log file ${clocLogPath}`);
        }
        const [language, filename, blank, comment, code] = clocInfo;
        if (filename.length < 3 || filename.slice(0, 2) !== './') {
            // the log file produced by the command build by the "clocCommand" function should all have the path starting with "./"
            // the path info contained in the commits of git do not have this "./"
            throw new Error(`all lines in the cloc log ${clocLogPath} should start with "./" - one does not: ${filename}`);
        }
        if (dict[filename]) {
            throw new Error(`File ${filename} present more than once in cloc log ${clocLogPath}`);
        }
        dict[filename] = {
            language,
            filename,
            blank: parseInt(blank),
            comment: parseInt(comment),
            code: parseInt(code),
        };
        return dict;
    }, {})), (0, rxjs_1.tap)({
        next: (dict) => {
            console.log(`====>>>> cloc info read for ${Object.keys(dict).length} files from ${clocLogPath}`);
        },
    }));
}
exports.clocFileDict = clocFileDict;
//# sourceMappingURL=read-cloc-log.js.map