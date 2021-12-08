import path = require('path');
import { appendFileObs, deleteFileObs, readLinesObs } from 'observable-fs';
import { ConfigReadCloc, ConfigReadMultiCloc } from './read-params/read-params';
import { executeCommand, executeCommandNewProcessToLinesObs } from './execute-command';
import { DEFAULT_OUT_DIR, getOutfileName } from './read-git';
import { share, catchError, concatMap, ignoreElements, merge, Observable, Subscriber, of } from 'rxjs';

export function createClocLog(config: ConfigReadCloc, action: string) {
    const [cmd, out] = clocCommand(config);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`,
    );
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
export function createClocNewProcess(config: ConfigReadCloc, outFile: string, action: string) {
    const { cmd, args, options } = clocCommandwWithArgs(config);
    const _cloc = executeCommandNewProcessToLinesObs(action, cmd, args, options).pipe(
        _filterClocHeader('language,filename,blank,comment,code'),
        share(),
    );
    const _writeFile = deleteFileObs(outFile).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                // emit something so that the next operation can continue
                return of(null);
            }
        }),
        concatMap(() => _cloc),
        concatMap((line) => {
            const _line = `${line}\n`;
            return appendFileObs(outFile, _line);
        }),
        ignoreElements(),
    );
    return merge(_cloc, _writeFile);
}

export function createSummaryClocLog(config: ConfigReadCloc, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`,
    );
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
export function createSummaryClocNewProcess(config: ConfigReadCloc, outFile: string, action: string) {
    const { cmd, args, options } = clocSummaryCommandWithArgs(config);
    const _cloc = executeCommandNewProcessToLinesObs(action, cmd, args, options).pipe(
        _filterClocHeader('files,language,blank,comment,code'),
        share(),
    );
    const _writeFile = deleteFileObs(outFile).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                // emit something so that the next operation can continue
                return of(null);
            }
        }),
        concatMap(() => _cloc),
        concatMap((line) => {
            const _line = `${line}\n`;
            return appendFileObs(outFile, _line);
        }),
        ignoreElements(),
    );
    return merge(_cloc, _writeFile);
}

export function buildClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-cloc.csv');
}

export function buildSummaryClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-summary-cloc.csv');
}

function _buildClocOutfile(config: ConfigReadCloc, endPart: string) {
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outClocFile, config.outClocFilePrefix, config.repoFolderPath, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}

function _filterClocHeader(startToken: string) {
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

// executes cloc command on all the repos and returns the array of the file names containing the cloc results (one file per repo)
// I can not use the async concurrent method (used with multi read of git) since apparently the factthat i download cloc via npx
// does not work with async Observables
export function createMultiClocLogs(config: ConfigReadMultiCloc, action: string) {
    const repoFolderPaths = config.repoFolderPaths;
    const basicConfig = { ...config };
    delete basicConfig.repoFolderPaths;
    return repoFolderPaths
        .map((repoFolderPath) => {
            const readSingleClocConfig: ConfigReadCloc = {
                repoFolderPath,
                ...basicConfig,
            };
            return readSingleClocConfig;
        })
        .reduce((outFiles, config) => {
            const outFile = createClocLog(config, action);
            outFiles.push(outFile);
            return outFiles;
        }, [] as string[]);
}

function clocCommand(config: ConfigReadCloc) {
    const out = buildClocOutfile(config);
    // npx cloc . --by-file --csv --out=<outFile>
    const { cmd, args } = clocCommandwWithArgs(config, out);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    return [`cd ${config.repoFolderPath} && ${cmdWithArgs}`, out];
}
function clocCommandwWithArgs(config: ConfigReadCloc, outFile?: string) {
    const { cmd, args, options } = clocSummaryCommandWithArgs(config, outFile);
    args.push('--by-file');
    return { cmd, args, options };
}
function clocSummaryCommand(config: ConfigReadCloc) {
    const out = buildSummaryClocOutfile(config);
    // npx cloc . --csv --out=<outFile>
    const { cmd, args } = clocSummaryCommandWithArgs(config, out);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    return [`cd ${config.repoFolderPath} && ${cmdWithArgs}`, out];
}
function clocSummaryCommandWithArgs(config: ConfigReadCloc, outFile?: string) {
    const args = ['cloc', '.', '--exclude-dir=node_modules', '--csv', clocDefsPath(config)];
    if (outFile) {
        const outArg = `--out=${outFile}`;
        args.push(outArg);
    }
    const options = { cwd: config.repoFolderPath };
    return { cmd: 'npx', args, options };
}
function clocDefsPath(config: ConfigReadCloc) {
    return config.clocDefsPath ? `--force-lang-def=${config.clocDefsPath} ` : '';
}

// returns the summary produced by cloc in the form of an array of strings in csv format
export function clocSummaryInfo(repoFolderPath: string, outDir: string, clocDefsPath?: string) {
    const config: ConfigReadCloc = {
        repoFolderPath,
        outDir,
        clocDefsPath,
    };
    return clocSummary(config, 'clocSummaryInfo');
}

function clocSummary(config: ConfigReadCloc, action: string) {
    const clocSummaryLogPath = createSummaryClocLog(config, action);
    return readLinesObs(clocSummaryLogPath);
}

export function clocSummaryStream(clocSummaryLogPath: string) {
    return readLinesObs(clocSummaryLogPath);
}
