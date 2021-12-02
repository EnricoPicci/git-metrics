import { map, tap } from 'rxjs';
import { readLinesObs } from 'observable-fs';

export type ClocInfo = { language: string; filename: string; blank: number; comment: number; code: number };
export type ClocDictionary = { [path: string]: ClocInfo };
// creates a dictionary where the key is the file path and the value is the ClocInfo for that file
export function clocFileDict(clocLogPath: string) {
    return readLinesObs(clocLogPath).pipe(
        // remove the first line which contains the csv header
        map((lines) => lines.slice(1)),
        // remove the last line which contains the total
        map((lines) => lines.slice(0, lines.length - 1)),
        map((lines) =>
            lines.reduce((dict, line) => {
                const clocInfo = line.trim().split(',');
                if (clocInfo.length !== 5) {
                    throw new Error(`Format of cloc line not as expected: ${line} - cloc log file ${clocLogPath}`);
                }
                const [language, filename, blank, comment, code] = clocInfo;
                if (filename.length < 3 || filename.slice(0, 2) !== './') {
                    // the log file produced by the command build by the "clocCommand" function should all have the path starting with "./"
                    // the path info contained in the commits of git do not have this "./"
                    throw new Error(
                        `all lines in the cloc log ${clocLogPath} should start with "./" - one does not: ${filename}`,
                    );
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
                } as ClocInfo;
                return dict;
            }, {} as ClocDictionary),
        ),
        tap({
            next: (dict) => {
                console.log(`====>>>> cloc info read for ${Object.keys(dict).length} files from ${clocLogPath}`);
            },
        }),
    );
}
