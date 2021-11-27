import path = require('path');
import { map, tap } from 'rxjs/operators';
import { readLinesObs } from 'observable-fs';
import { ConfigReadCloc, ConfigReadMultiCloc } from './config/config';
import { executeCommand } from './execute-command';
import { DEFAULT_OUT_DIR, getOutfileName } from './read-git';

export function createClocLog(config: ConfigReadCloc, action: string) {
    const [cmd, out] = clocCommand(config);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${config.repoFolderPath} calculated`,
    );
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
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
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outClocFile, config.outClocFilePrefix, config.repoFolderPath, '-cloc.csv');
    const out = path.resolve(path.join(outDir, outFile));
    // npx cloc . --by-file --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --by-file --csv ${clocDefsPath(
            config,
        )} --out=${out}`,
        out,
    ];
}
function clocSummaryCommand(config: ConfigReadCloc) {
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outSummaryClocFile = getOutfileName(config.outClocFile, null, config.repoFolderPath, '-summary-cloc.csv');
    const out = path.resolve(path.join(outDir, outSummaryClocFile));
    // npx cloc . --csv --out=<outFile>
    return [
        `cd ${config.repoFolderPath} && npx cloc . --exclude-dir=node_modules --csv ${clocDefsPath(
            config,
        )}--out=${out}`,
        out,
    ];
}
function clocDefsPath(config: ConfigReadCloc) {
    return config.clocDefsPath ? `--force-lang-def=${config.clocDefsPath} ` : '';
}

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
