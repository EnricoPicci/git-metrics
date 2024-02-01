import path from 'path';

import {
    concat,
    concatMap,
    defaultIfEmpty,
    filter,
    from,
    ignoreElements,
    map,
    merge,
    of,
    pipe,
    share,
    skip,
    tap,
} from 'rxjs';

import { appendFileObs, writeFileObs } from 'observable-fs';

import {
    executeCommand,
    executeCommandInShellNewProcessObs,
    executeCommandNewProcessToLinesObs,
    executeCommandObs,
} from '../tools/execute-command/execute-command';

import { ClocDictionary, ClocFileInfo, ClocLanguageStats } from './cloc.model';
import { CLOC_CONFIG } from './config';
import { ClocParams } from './cloc-params';
import { gitRepoPaths } from '../git-functions/repo-path';
import { ignoreUpTo } from '../tools/rxjs-operators/ignore-up-to';
import { deleteFile$ } from '../tools/observable-fs-extensions/delete-file-ignore-if-missing';

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
            return outfile ? writeFileObs(outfile, output).pipe(map(() => output)) : of(output);
        }),
        map((output) => {
            let headerIndex = -1;
            for (let i = 0; i < output.length; i++) {
                if (output[i].startsWith('files,language,blank,comment,code')) {
                    headerIndex = i;
                    break;
                }
            }
            // remove all the lines before the header and the header itself
            // if headerIndex is -1, then the header was not found and therefore there are no statistics
            // to return, so we return an empty array (this can occur if we run the cloc command on a folder that
            // does not contain any files or does not exist)
            const lines = headerIndex > -1 ? output.slice(headerIndex + 1) : [];
            const clocStatsArray: ClocLanguageStats[] = [];
            lines.forEach((line) => {
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
        `${executable} --csv ${_vcs} --timeout=${CLOC_CONFIG.TIMEOUT} ${path}`,
    ).pipe(
        map((output) => {
            return output.split('\n').filter((l) => l.trim().length > 0);
        }),
    );
}

/**
 * Runs the cloc command on a Git repository and returns the result in the form of a stream of one ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * By default the cloc command is run on the current directory.
 * By default the cloc command is run with the --vcs=git option.
 * This means that, if the repoPath points to a folder where there is git repo, then the files in the .gitignore are not counted.
 * @param repoPath The path to the Git repository to run the cloc command on. Defaults to the current directory.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function clocSummaryOnGitRepo$(repoPath = './', vcs = 'git') {
    return clocSummary$(repoPath, vcs);
}

/**
 * Runs the cloc command on a Git repository and returns the result in the form of a stream of one ClocLanguageStats array.
 * The result is a summary in the sense that it shows results per language but not per file.
 * The cloc command is run without the --vcs=git option. This means that, if the repoPath points to a folder where there is git repo,
 * the .gitignore is "ignored", hence also the files that should be excluded according to the .gitignore are counted.
 * For instance, if the repo is a node project, then all the files in the node_modules folder are counted.
 * @param folderPath The path to the Git repository to run the cloc command on. Defaults to the current directory.
 * @returns An Observable that emits a ClocLanguageStats array.
 */
export function clocSummaryOnFolderNoGit$(folderPath = './') {
    return clocSummary$(folderPath, undefined);
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
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`);
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
    return clocSummary$(folderPath, vcs, outFile).pipe(ignoreElements(), defaultIfEmpty(outFile));
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
export function clocByfile$(params: ClocParams, action = 'calculate cloc', writeFile = true) {
    // execute the cloc command in a new process and return the stream of lines output of the cloc command execution
    const { cmd, args, options } = clocByfileCommandWithArgs(params);
    const _cloc = executeCommandNewProcessToLinesObs(action, cmd, args, options).pipe(
        map((line) => {
            return line.trim()
        }),
        ignoreUpTo(clocByfileHeader),
        share(),
    );

    // if writeFile is true, then calculate the name of the output file
    const outFile = writeFile ? buildClocOutfile(params, '-cloc.csv') : '';

    // create an Observable that deletes the output file if it exists and then takes the cloc strem
    // and appends each line to the output file
    const _writeFile = deleteFile$(outFile).pipe(
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
    console.log(`====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`);
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
 * Searches for all Git repositories in a given folder and runs the cloc command with the --by-file option on each of them.
 * Returns an Observable that notifies all the cloc info for all the repos in the form of lines of text which represent CSV records.
 * The first line notified is the clocByFile header.
 * Errors if the folderPath does not exist or is not a folder.
 * Returns just the header if the folderPath does not contain any Git repository.
 * @param folderPath The path to the folder to search for Git repositories.
 * @param excludeRepoPaths An optional array of paths to exclude from the search.
 * @returns An Observable that emits the cloc info for all the Git repositories in the given folder.
 */
export function clocByFileForRepos$(folderPath: string, excludeRepoPaths = []) {
    const repos = gitRepoPaths(folderPath, excludeRepoPaths)
    const cloc$ = from(repos).pipe(
        concatMap((repoPath) => {
            const params: ClocParams = {
                folderPath: repoPath,
                vcs: 'git',
            }
            // remove the folderPath string from the repoPath string so that the repoPath string represents just the relevant repo info
            // for instance, if folderPath is /home/enrico/code/git-metrics/repos and repoPath is /home/enrico/code/git-metrics/repos/dbm,
            // then repoPath will be /dbm
            const repo = repoPath.replace(folderPath, '')
            return clocByfile$(params, 'clocByFileForRepos$ running on ' + repoPath, false).pipe(
                // remove the first line which contains the csv header form all the streams representing
                // the output of the cloc command execution on each repo
                skip(1),
                // remove the last line which contains the total
                filter((line) => line.slice(0, 3) !== 'SUM'),
                // add repo path at the end of each line
                map((line) => {
                    const file = line.split(',')[1];
                    // isolate in the module variable the path the file
                    const module = path.dirname(file);
                    return `${line},${repo},${repoPath},${module}`;
                }),
            );
        }),
    );
    // return a file which is a concatenation of the cloc header followed by the cloc info for each repo
    return concat(of(clocByfileHeaderWithRepo), cloc$);
}

/**
 * Writes the cloc info for all the Git repositories in a given folder to a file.
 * The file name is derived from the folder path.
 * Returns an Observable that notifies the name of the file where the cloc info is saved once the cloc command execution is finished.
 * @param folderPath The path to the folder to search for Git repositories.
 * @param outDir The path to the folder where the output file should be saved. Defaults to the current directory.
 * @param excludeRepoPaths An array of repository paths to exclude from the calculation.
 * @returns An Observable that emits the name of the file where the cloc info is saved.
 */
export function writeClocByFileForRepos$(folderPath: string, outDir = './', excludeRepoPaths = []) {
    const outFile = buildOutfileName('', folderPath, 'cloc-', '-byfile.csv');
    const outFilePath = path.join(outDir, outFile);
    return deleteFile$(outFilePath).pipe(
        concatMap(() => clocByFileForRepos$(folderPath, excludeRepoPaths)),
        concatMap((line) => {
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                console.log(`====>>>> cloc info saved on file ${outFilePath}`);
            },
        }),
    );
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes


/**
 * Represents the header for the cloc command when the --by-file output format is specified.
 */
export const clocByfileHeader = 'language,filename,blank,comment,code';
/**
 * Represents the header for the output stream produced by clocByFileForRepos$.
 */
export const clocByfileHeaderWithRepo = `${clocByfileHeader},repo,repoPath,module`;

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
    cmd = cmd + ' --by-file';
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
    return outFile ? outFile : `${_prefix}${_repoFolderName}${_postfix}`;
}

function clocByfileCommandWithArgs(params: ClocParams) {
    const args = ['cloc', '.', '--csv', `--timeout=${CLOC_CONFIG.TIMEOUT}`, '--by-file'];
    if (params.vcs) {
        args.push(`--vcs=${params.vcs}`);
    }
    if (params.notMatch && params.notMatch?.length > 0) {
        // excludeRegex is a string that contains the strings to be excluded separated by !
        // for instance if notMatch is ['*db*', '*ods*'], then excludeRegex will be '*db*|*ods*'
        const excludeRegex = params.notMatch.join('|');
        args.push(`--not-match-d=(${excludeRegex})`);
        args.push(`--fullpath`);
    }
    if (params.languages && params.languages?.length > 0) {
        const languagesString = params.languages.join(',');
        args.push(`--include-lang=${languagesString}`);
    }
    const options = { cwd: params.folderPath };
    const cmd = CLOC_CONFIG.USE_NPX ? 'npx' : 'cloc';
    return { cmd, args, options };
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
                    file: filename,
                    blank: parseInt(blank),
                    comment: parseInt(comment),
                    code: parseInt(code),
                };
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
