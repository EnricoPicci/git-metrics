import { catchError, map, of, pipe, tap } from 'rxjs';
import { readLinesObs } from 'observable-fs';

export type ClocInfo = { language: string; filename: string; blank: number; comment: number; code: number };
export type ClocDictionary = { [path: string]: ClocInfo };
// creates a dictionary where the key is the file path and the value is the ClocInfo for that file
export function clocFileDict(clocLogPath: string) {
    return readLinesObs(clocLogPath).pipe(
        toClocFileDict(clocLogPath),
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`!!!!!!!! file ${clocLogPath} not found`);
                return of({} as ClocDictionary);
            }
            throw err;
        }),
    );
}

export function toClocFileDict(clocLogPath?: string) {
    const clocFileMsg = clocLogPath ? ` - cloc log file ${clocLogPath}` : '';

    return pipe(
        // remove the first line which contains the csv header
        map((lines: string[]) => lines.slice(1)),
        // remove the last line which contains the total
        map((lines) => {
            let sumLineIndex: number | undefined = undefined;
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
        }),
        map((lines) => {
            return lines.reduce((dict, line) => {
                const clocInfo = line.trim().split(',');
                if (clocInfo.length !== 5) {
                    throw new Error(`Format of cloc line not as expected: ${line} ${clocFileMsg}`);
                }
                const [language, filename, blank, comment, code] = clocInfo;
                if (filename.trim().length === 0) {
                    throw new Error(`The file neme in line ${clocInfo} is the empty string ${clocFileMsg}`);
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
                } as ClocInfo;
                return dict;
            }, {} as ClocDictionary);
        }),
        tap({
            next: (dict) => {
                console.log(`====>>>> cloc info read for ${Object.keys(dict).length} ${clocFileMsg}`);
            },
        }),
    );
}
