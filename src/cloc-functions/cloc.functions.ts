import path from 'path';

import {
    Observable, Subscriber, catchError, concatMap, defaultIfEmpty,
    ignoreElements, map, merge, of, pipe, share, tap, toArray
} from 'rxjs';

import { appendFileObs, deleteFileObs, readLinesObs, writeFileObs, } from 'observable-fs';

import {
    executeCommand, executeCommandInShellNewProcessObs,
    executeCommandNewProcessToLinesObs, executeCommandObs
} from '../tools/execute-command/execute-command';

import { ClocDictionary, ClocFileInfo, ClocLanguageStats } from './cloc.model';
import { CLOC_CONFIG } from './config';
import { ClocParams } from './cloc-params';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Runs the cloc command with the summary option and returns the result in the form of a stream emitting one 
 * ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param path The path to run the cloc command on. Defaults to the current directory.
 * @param vcs An optional version control system to use with the cloc command.
 * @param outfile An optional file path to write the output of the cloc command to.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function clocSummary$(path = './', vcs?: string, outfile = '') {
    return clocSummaryCsvRaw$(path, vcs).pipe(
        concatMap((output) => {
            return outfile ?
                writeFileObs(outfile, output).pipe(map(() => output)) :
                of(output);
        }),
        map((output) => {
            // remove the first line since it contains the header
            const lines = output.slice(1);
            const clocStatsArray: ClocLanguageStats[] = [];
            lines.forEach(line => {
                if (line.trim().length === 0) {
                    return;
                }
                // fields are the split of 'files,language,blank,comment,code'
                const fields = line.split(',');
                const files = fields[0];
                const language = fields[1];
                const blank = fields[2];
                const comment = fields[3];
                const code = fields[4];
                const langStats: ClocLanguageStats = {
                    language,
                    nFiles: parseInt(files),
                    blank: parseInt(blank),
                    comment: parseInt(comment),
                    code: parseInt(code),
                };
                clocStatsArray.push(langStats);
            });
            return clocStatsArray;
        }),
    );
}

/**
 * Runs the cloc command with the summary option and returns the result in CSV format as an array of lines.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param path The path to run the cloc command on. Defaults to the current directory.
 * @param vcs An optional version control system to use with the cloc command.
 * @returns An Observable that emits an array of strings, each containing the CSV-formatted cloc summary info.
 */
export function clocSummaryCsvRaw$(path = './', vcs?: string) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';

    const executable = CLOC_CONFIG.USE_NPX ? 'npx cloc' : 'cloc';
    return executeCommandObs(
        'run cloc summary',
        `${executable} --csv ${_vcs} --timeout=${CLOC_CONFIG.TIMEOUT} ${path}`
    ).pipe(
        map(output => {
            return output.split('\n').filter(l => l.trim().length > 0);
        })
    )
}

/**
 * Runs the cloc command on a Git repository and returns the result in the form of a stream of one ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param repoPath The path to the Git repository to run the cloc command on. Defaults to the current directory.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function clocSummaryOnGitRepo$(repoPath = './') {
    return clocSummary$(repoPath, 'git');
}

/**
 * Runs the cloc command and writes the result to a file.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns The name of the file where the cloc info is saved.
 */
export function writeClocSummary(params: ClocParams, action = 'writeClocS-cloc-summary.csvummary') {
    const [cmd, out] = clocSummaryCommand(params);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`,
    );
    console.log(`====>>>> cloc summary info saved on file ${out}`);
    return out;
}

/**
 * Runs the cloc command with the summary option and writes the result to a file.
 * The result is a summary in the sense that it shows results per language but not per file.
 * Notifies the name of the file where the cloc info is saved once the cloc command execution is finished.
 * @param params The parameters to pass to the cloc command, including the folder path and VCS to use.
 * @returns An Observable that emits no elements but completes when the cloc command execution is finished.
 */
export function writeClocSummary$(params: ClocParams) {
    const folderPath = params.folderPath;
    const vcs = params.vcs;
    const outFile = buildClocOutfile(params, '-cloc-summary.csv');
    return clocSummary$(folderPath, vcs, outFile).pipe(
        ignoreElements(),
        defaultIfEmpty(outFile),
    );
}

/**
 * Executes the cloc command in a new process and returns the stream of lines output of the cloc command execution.
 * The result is per file, showing the number of lines in each file.
 * If `writeFile` is true, then the output of the cloc command will be written to a file with a name based on the 
 * provided parameters.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @param writeFile Whether or not to write the output of the cloc command to a file (the file name is derived from the params).
 * @returns An Observable that emits the lines output of the cloc command execution.
 */
export function clocByfile$(params: ClocParams, action: string, writeFile = true) {
    // execute the cloc command in a new process and return the stream of lines output of the cloc command execution
    const { cmd, args, options } = clocByfileCommandWithArgs(params);
    const _cloc = executeCommandNewProcessToLinesObs(action, cmd, args, options).pipe(
        ignoreUpTo('language,filename,blank,comment,code'),
        share(),
    );

    // if writeFile is true, then calculate the name of the output file
    let outFile = writeFile ? buildClocOutfile(params, '-cloc.csv') : '';

    // create an Observable that deletes the output file if it exists and then takes the cloc strem
    // and appends each line to the output file
    const _writeFile = deleteFileObs(outFile).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                // emit something so that the next operation can continue
                return of(null);
            }
            throw new Error(err);
        }),
        concatMap(() => _cloc),
        concatMap((line) => {
            const _line = `${line}\n`;
            return appendFileObs(outFile, _line);
        }),
        // we are not interested in the output of this stream, since this stream is triggered only if writeFile is true
        // regardless of the value of writeFile, we want are going to trigger the _cloc stream with the merge function below
        // therefore, the cloc stream will be triggered regardless of the value of writeFile and will always emit
        // what is produced by the cloc command, hence we must ignore the output of this stream (otherwise we would 
        // have duplicate output)
        ignoreElements(),
    );
    const _streams = [_cloc];
    // if writeFile is true, then add the _writeFile stream to the streams array
    if (writeFile) {
        _streams.push(_writeFile);
    }
    // merge the streams and return the merged stream
    // if writeFile is false then the merged stream will be the _cloc stream
    // if writeFile is true then the merged stream will be the _cloc stream and the output file will be written
    // silently in the background without the emissione of any value since we have used the ignoreElements operator
    return merge(..._streams);
}

/**
 * Runs the cloc command with the by-file option and writes the result to a file.
 * The result is per file, showing the number of lines in each file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns The name of the file where the cloc info is saved.
 */
export function writeClocByfile(params: ClocParams, action = 'writeClocByFile') {
    const [cmd, out] = clocByFileCommand(params);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`,
    );
    console.log(`====>>>> cloc by file info saved on file ${out}`);
    return out;
}

/**
 * Runs the cloc command with the by-file option and writes the result to a file.
 * Notifies the name of the file where the cloc info is saved once the cloc command execution is finished.
 * The result is per file, showing the number of lines in each file.
 * @param params The parameters to pass to the cloc command.
 * @param action A comment describing the action we are going to perform.
 * @returns An Observable that emits the name of the file written once the cloc command execution is finished.
 */
export function writeClocByFile$(params: ClocParams, action = 'cloc') {
    const [cmd, out] = clocByFileCommand(params);

    return executeCommandInShellNewProcessObs(action, cmd).pipe(
        ignoreElements(),
        defaultIfEmpty(out),
        tap({
            next: (outFile) => {
                console.log(
                    `====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`,
                );
                console.log(`====>>>> cloc info saved on file ${outFile}`);
            },
        }),
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
 * @returns An Observable that emits a dictionary of ClocFileInfo objects representing the cloc info for each file in the cloc log.
 */
export function clocFileDictFromClocStream$(cloc$: Observable<string>) {
    return cloc$.pipe(toArray(), toClocFileDict());
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function clocCommand(params: ClocParams) {
    // npx cloc . --vcs=git --csv  --timeout=1000000
    const cd = `cd ${params.folderPath}`;
    const program = CLOC_CONFIG.USE_NPX ? 'npx cloc' : 'cloc';
    const vcs = params.vcs ? `--vcs=${params.vcs}` : '';
    const clocDefPath = params.clocDefsPath ? `--force-lang-def=${params.clocDefsPath}` : '';
    const cmd = `${cd} && ${program} . ${vcs} --csv ${clocDefPath} --timeout=${CLOC_CONFIG.TIMEOUT}`;
    return cmd;
}
function clocSummaryCommand(params: ClocParams) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv
    const out = buildClocOutfile(params, '-cloc-summary.csv');
    const cmd = clocCommand(params) + ` --out=${out}`;
    return [cmd, out];
}
function clocByFileCommand(params: ClocParams) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv --by-file
    const out = buildClocOutfile(params, '-cloc-byfile.csv');
    let cmd = clocCommand(params) + ` --out=${out}`;
    cmd = cmd + ' --by-file'
    return [cmd, out];
}
function buildClocOutfile(config: ClocParams, endPart: string) {
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outClocFile!, config.folderPath, config.outClocFilePrefix, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}

/**
 * Generates an output file name based on the provided parameters.
 * If an `outFile` parameter is provided, it will be used as the output file name.
 * Otherwise, the output file name will be generated based on the `prefix`, `folder`, and `postfix` parameters.
 * If `prefix` is provided, it will be used as a prefix for the output file name.
 * If `repoFolder` is provided, it will be used as the base folder name for the output file name.
 * If `postfix` is provided, it will be appended to the end of the output file name.
 * If `repoFolder` is not provided or is an empty string, the current working directory name will be used as the base folder name.
 * @param outFile The desired output file name.
 * @param repoFolder An optional base folder name for the output file name.
 * @param prefix An optional prefix for the output file name.
 * @param postfix An optional postfix for the output file name.
 * @returns The generated output file name.
 */
export function buildOutfileName(outFile = '', repoFolder = '', prefix?: string, postfix?: string) {
    const repoFolderName = path.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path.parse(process.cwd()).name : repoFolderName;
    const _prefix = prefix ?? '';
    const _postfix = postfix ?? '';
    return outFile ? outFile : `${_prefix}${(_repoFolderName)}${_postfix}`;
}

function clocByfileCommandWithArgs(params: ClocParams) {
    const args = ['cloc', '.', '--csv', `--timeout=${CLOC_CONFIG.TIMEOUT}`, '--by-file'];
    if (params.vcs) {
        args.push(`--vcs=${params.vcs}`);
    }
    const options = { cwd: params.folderPath };
    const cmd = CLOC_CONFIG.USE_NPX ? 'npx' : 'cloc';
    return { cmd, args, options };
}

/**
 * Returns an operator function that filters the input Observable to only include lines of text
 * that come after the line that includes the specified start token.
 * @param startToken The start token to look for in the input stream.
 * @returns An operator function that filters the input Observable.
 */
function ignoreUpTo(startToken: string) {
    return (source: Observable<string>) => {
        return new Observable((subscriber: Subscriber<string>) => {
            let startOutput = false;
            const subscription = source.subscribe({
                next: (line) => {
                    startOutput = startOutput || line.includes(startToken);
                    if (startOutput) {
                        subscriber.next(line);
                    }
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}

/**
 * Returns a custom rxjs operator that expects a stream emitting an array of lines representing the output of a cloc command 
 * (with the by-file option), and returns a stream that notifies a dictionary of ClocFileInfo objects, where each object 
 * represents the cloc info for a file.
 * The cloc info includes the number of blank lines, comment lines, and code lines in the file.
 * @param clocLogPath The path to the cloc log file. If not provided, an empty dictionary is returned.
 * @returns A custom rxjs operator that turns a stream of lines from a cloc file into a stream which notifies a ClocDictionary.
 * @throws An error if the format of a line in the cloc log is not as expected, or if a file name is the empty string or present more than once in the cloc log.
 */
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
                    throw new Error(`The file name in line ${clocInfo} is the empty string ${clocFileMsg}`);
                }
                if (dict[filename]) {
                    throw new Error(`File ${filename} present more than once in cloc log ${clocFileMsg}`);
                }
                const stat: ClocFileInfo = {
                    language,
                    filename,
                    blank: parseInt(blank),
                    comment: parseInt(comment),
                    code: parseInt(code),
                }
                dict[filename] = stat;
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