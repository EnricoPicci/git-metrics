import path = require('path');
import {
    catchError,
    concatMap,
    ignoreElements,
    of,
    map,
    defaultIfEmpty,
    tap,
    from,
} from 'rxjs';

import { readLinesObs } from 'observable-fs';

import {
    executeCommandInShellNewProcessObs,
} from '../../../tools/execute-command/execute-command';

import { DEFAUL_CONFIG } from '../0-config/config';
import { ConfigReadCloc, ConfigReadMultiCloc } from './read-params/read-params';
import { DEFAULT_OUT_DIR, getOutfileName } from './read-git';
import { ClocParams, clocByfile$, clocSummary$, writeClocByFile$, writeClocByfile, writeClocSummary } from '../../../cloc-functions/cloc.functions';

export function createClocLog(config: ConfigReadCloc, action: string) {
    const params = paramsFromConfig(config);
    return writeClocByfile(params, action);
}
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
export function streamClocNewProcess(config: ConfigReadCloc, action: string) {
    const params = paramsFromConfig(config);
    return clocByfile$(params, action, true);
}

export function createClocLogNewProcess(config: ConfigReadCloc, action = 'cloc') {
    const params = paramsFromConfig(config);
    return writeClocByFile$(params, action);
}

export function createSummaryClocLog(config: ConfigReadCloc, action = 'clocSummary') {
    const params = paramsFromConfig(config);
    return writeClocSummary(params, action)
}

// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
export function streamSummaryClocNewProcess(
    config: ConfigReadCloc,
    outFile?: string,
    vcs?: string,
) {
    return clocSummary$(config.repoFolderPath, vcs, outFile).pipe(
        concatMap(stats => from(stats)),
        map(stat => `${stat.nFiles},${stat.language},${stat.blank},${stat.comment},${stat.code}`),
    )
}

function paramsFromConfig(config: ConfigReadCloc) {
    const clocParams: ClocParams = {
        folderPath: config.repoFolderPath,
        outDir: config.outDir,
        outClocFile: config.outClocFile,
        outClocFilePrefix: config.outClocFilePrefix,
        clocDefsPath: config.clocDefsPath,
    };
    return clocParams;
}

export function createSummaryClocNewProcess(config: ConfigReadCloc, action = 'clocSummary') {
    const [cmd, out] = clocSummaryCommand(config);

    return executeCommandInShellNewProcessObs(action, cmd).pipe(
        ignoreElements(),
        defaultIfEmpty(out),
        tap({
            next: (outFile) => {
                console.log(
                    `====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`,
                );
                console.log(`====>>>> cloc info saved on file ${outFile}`);
            },
        }),
    );
}

export function buildClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-cloc.csv');
}

export function buildSummaryClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-summary-cloc.csv');
}

function _buildClocOutfile(config: ConfigReadCloc, endPart: string) {
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outClocFile!, config.outClocFilePrefix, config.repoFolderPath, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}

// executes cloc command on all the repos and returns the array of the file names containing the cloc results (one file per repo)
// I can not use the async concurrent method (used with multi read of git) since apparently the factthat i download cloc via npx
// does not work with async Observables
export function createMultiClocLogs(config: ConfigReadMultiCloc, action: string) {
    const repoFolderPaths = config.repoFolderPaths;
    const basicConfig: any = { ...config };
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

function clocSummaryCommand(config: ConfigReadCloc) {
    const out = buildSummaryClocOutfile(config);
    // npx cloc . --csv --out=<outFile>
    const { cmd, args } = clocSummaryCommandWithArgs(config, out);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    return [`cd ${config.repoFolderPath} && ${cmdWithArgs}`, out];
}
function clocSummaryCommandWithArgs(config: ConfigReadCloc, outFile?: string) {
    const args = ['cloc', '.', '--vcs=git', '--csv', clocDefsPath(config), `--timeout=${DEFAUL_CONFIG.CLOC_TIMEOUT}`];
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
    return clocSummaryStream(clocSummaryLogPath);
}

export function clocSummaryStream(clocSummaryLogPath: string) {
    return readLinesObs(clocSummaryLogPath).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                console.log(`!!!!!!!! file ${clocSummaryLogPath} not found`);
                return of([] as string[]);
            }
            throw err;
        }),
    );
}
