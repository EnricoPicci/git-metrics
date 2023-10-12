import { Observable, catchError, map, of, pipe, tap, toArray } from 'rxjs';

import { readLinesObs } from 'observable-fs';

import { ClocDictionary, ClocInfo } from './cloc-dictionary.model';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Reads a cloc log file and returns an Observable that emits a dictionary of ClocFileInfo objects, 
 * where each object represents the cloc info for a file.
 * The cloc info includes the number of blank lines, comment lines, and code lines in the file.
 * If the cloc log file is not found, the function logs a message to the console and returns an Observable that emits 
 * an empty dictionary.
 * @param clocLogPath The path to the cloc log file.
 * @returns An Observable that emits a dictionary of ClocFileInfo objects representing the cloc info for each file in the cloc log.
 */
export function clocFileDictFromClocLogFile$(clocLogPath: string) {
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

/**
 * Takes an Observable of strings representing the output of the cloc command (with the by-file option) and 
 * returns an Observable that emits a dictionary of ClocFileInfo objects, where each object represents the cloc info for a file.
 * The cloc info includes the number of blank lines, comment lines, and code lines in the file.
 * @param cloc$ An Observable of strings representing the output of the cloc command.
 * @returns An Observable that emits a dictionary of ClocFileInfo objects representing the cloc info for each file in the cloc log.
 */
export function clocFileDictFromClocStream$(cloc$: Observable<string>) {
    return cloc$.pipe(toArray(), toClocFileDict());
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function toClocFileDict(clocLogPath?: string) {
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
