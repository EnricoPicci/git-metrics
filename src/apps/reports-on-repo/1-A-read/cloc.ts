import path = require('path');
import {
    concatMap,
    map,
    from,
} from 'rxjs';


import { ConfigReadCloc } from './read-params/read-params';
import { DEFAULT_OUT_DIR, getOutfileName } from './read-git';
import { ClocParams, clocByfile$, clocSummary$, clocSummaryCsvRaw$, writeClocByFile$, writeClocByfile, writeClocSummary, writeClocSummary$ } from '../../../cloc-functions/cloc.functions';

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

export function createSummaryClocNewProcess(config: ConfigReadCloc, _action = 'clocSummary') {
    const params = paramsFromConfig(config);
    return writeClocSummary$(params);
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

export function buildClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-cloc.csv');
}

export function buildSummaryClocOutfile(config: ConfigReadCloc) {
    return _buildClocOutfile(config, '-cloc-summary.csv');
}

function _buildClocOutfile(config: ConfigReadCloc, endPart: string) {
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outClocFile!, config.outClocFilePrefix, config.repoFolderPath, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}

// returns the summary produced by cloc in the form of an array of strings in csv format
export function clocSummaryInfo(repoFolderPath: string, _outDir = '', _clocDefsPath?: string) {
    return clocSummaryCsvRaw$(repoFolderPath);
}
