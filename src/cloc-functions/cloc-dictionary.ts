import { Observable, catchError, map, of, pipe, tap, toArray } from 'rxjs';

import { readLinesObs } from 'observable-fs';

import { ClocDictionary } from './cloc-dictionary.model';
import { clocByfile$ } from './cloc';
import { ClocFileInfo } from './cloc.model';
import { ExecuteCommandObsOptions } from '../tools/execute-command/execute-command';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


/**
 * Returns an Observable that emits a dictionary where the keys are the file paths of the files contained 
 * in the folder and its subfolders and the values are the cloc info for the files.
 * The cloc info includes the number of blank lines, comment lines, and code lines in the file.
 * If the folderPath points to a non existing folder, the function throws an error.
 * @param folderPath The path to the folder to search for files.
 * @returns An Observable that emits a dictionary of cloc info for all files in the given folder and its subfolders.
 */
export function clocFileDict$(folderPath: string, languages: string[] = [], options: ExecuteCommandObsOptions = {}) {
    const clocParams = {
        folderPath,
        vcs: 'git',
        languages
    };
    return clocByfile$(clocParams, 'create cloc log stream', false, options).pipe(
        toArray(),
        toClocFileDict(folderPath)
    );
}

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
 * @param folder The path to the folder for which the cloc command was run.
 * @returns An Observable that emits a dictionary of ClocFileInfo objects representing the cloc info for each file in the cloc log.
 */
export function clocFileDictFromClocStream$(cloc$: Observable<string>, folder: string) {
    return cloc$.pipe(toArray(), toClocFileDict(folder));
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function toClocFileDict(folder: string, clocLogPath?: string) {
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
                console.warn(`${folder} - possibly not a git repo (or any of the parent directories) or no files found`);
            }
            return lines.slice(0, sumLineIndex);
        }),
        map((lines) => {
            return lines.reduce((dict, line) => {
                const clocInfo = line.trim().split(',');
                if (clocInfo.length !== 5) {
                    // do not throw an error since very rarely and randomly the cloc command may produce a line with not exactly 5 fields
                    // For instance this is the message received during a massive code-turnover processing
                    // Format of cloc line not as expected: TypeScript,./projects/rgi/passpro-next-core-ui/src/lib/app/content-lock/lock-history,.modal.ts,10,0,96
                    console.error(`Format of cloc line not as expected: ${line} ${clocFileMsg}`);
                    return dict;
                }
                const [language, file, blank, comment, code] = clocInfo;
                if (file.trim().length === 0) {
                    throw new Error(`The file neme in line ${clocInfo} is the empty string ${clocFileMsg}`);
                }
                if (dict[file]) {
                    throw new Error(`File ${file} present more than once in cloc log ${clocFileMsg}`);
                }
                dict[file] = {
                    language,
                    file,
                    blank: parseInt(blank),
                    comment: parseInt(comment),
                    code: parseInt(code),
                } as ClocFileInfo;
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
