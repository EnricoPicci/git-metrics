import { Observable, Subscriber, catchError, concatMap, ignoreElements, map, merge, of, share } from 'rxjs';
import { executeCommand, executeCommandNewProcessToLinesObs, executeCommandObs } from '../tools/execute-command/execute-command';

import { ClocLanguageStats } from './cloc.model';
import { CONFIG } from '../config';
import path from 'path';
import { appendFileObs, deleteFileObs } from 'observable-fs';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

export type ClocParams = {
    folderPath: string;
    outDir: string;
    outClocFile?: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
    useNpx?: boolean
};

/**
 * Runs the cloc command and returns the result in the form of a ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param path The path to run the cloc command on. Defaults to the current directory.
 * @param vcs An optional version control system to use with the cloc command.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function runClocSummary(path = './', vcs?: string) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs('run cloc', `cloc --json ${_vcs} --timeout=${CONFIG.CLOC_TIMEOUT} ${path}`).pipe(
        map((output) => {
            const clocOutputJson = JSON.parse(output);
            const clocStatsArray: ClocLanguageStats[] = [];
            Object.entries(clocOutputJson).forEach(([language, stats]: [string, any]) => {
                if (language !== 'header') {
                    const langStats: ClocLanguageStats = {
                        language,
                        nFiles: stats.nFiles,
                        blank: stats.blank,
                        comment: stats.comment,
                        code: stats.code,
                    };
                    clocStatsArray.push(langStats);
                }
            });
            return clocStatsArray;
        }),
    );
}

/**
 * Runs the cloc command on a Git repository and returns the result in the form of a ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * @param repoPath The path to the Git repository to run the cloc command on. Defaults to the current directory.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function runClocSummaryOnGitRepo(repoPath = './') {
    return runClocSummary(repoPath, 'git');
}

/**
 * Runs the cloc command with the by-file option and writes the result to a file.
 * The result is per file, showing the number of lines in each file.
 * @param params The parameters to pass to the cloc command.
 * @param action The action to execute the cloc command with.
 * @returns The name of the file where the cloc info is saved.
 */
export function writeClocByfile(params: ClocParams, action = 'writeClocLogByFile') {
    const [cmd, out] = clocByFileCommand(params);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`,
    );
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}

/**
 * Executes the cloc command in a new process and returns the stream of lines output of the cloc command execution.
 * The result is per file, showing the number of lines in each file.
 * If `writeFile` is true, then the output of the cloc command will be written to a file with a name based on the 
 * provided parameters.
 * @param params The parameters to pass to the cloc command.
 * @param action The action to execute the cloc command with.
 * @param writeFile Whether or not to write the output of the cloc command to a file.
 * @returns An Observable that emits the lines output of the cloc command execution.
 */
export function streamClocByfile(params: ClocParams, action: string, writeFile = true) {
    // execute the cloc command in a new process and return the stream of lines output of the cloc command execution
    const { cmd, args, options } = clocByfileCommandWithArgs(params);
    const _cloc = executeCommandNewProcessToLinesObs(action, cmd, args, options).pipe(
        ignoreUpTo('language,filename,blank,comment,code'),
        share(),
    );

    // if writeFile is true, then calculate the name of the output file
    let outFile = writeFile ? _buildClocOutfile(params, '-cloc.csv') : '';

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


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function clocByFileCommand(params: ClocParams) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv --by-file
    const cd = `cd ${params.folderPath}`;
    const program = params.useNpx ? 'npx cloc' : 'cloc';
    const clocDefPath = params.clocDefsPath ? `--force-lang-def=${params.clocDefsPath}` : '';
    const out = _buildClocOutfile(params, '-cloc.csv');
    const cmd = `${cd} && ${program} . --vcs=git --csv ${clocDefPath} --timeout=${CONFIG.CLOC_TIMEOUT} --out=${out} --by-file`;
    return [cmd, out];
}
export function buildClocOutfile(config: ClocParams) {
    return _buildClocOutfile(config, '-cloc.csv');
}
function _buildClocOutfile(config: ClocParams, endPart: string) {
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
    const args = ['cloc', '.', '--vcs=git', '--csv', `--timeout=${CONFIG.CLOC_TIMEOUT}`, '--by-file'];
    const options = { cwd: params.folderPath };
    const cmd = params.useNpx ? 'npx' : 'cloc';
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