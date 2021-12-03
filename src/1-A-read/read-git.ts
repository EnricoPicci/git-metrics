import path = require('path');
import { forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
    ConfigReadBrachesGraph,
    ConfigReadCommits,
    ConfigReadMultiReposCommits,
    ConfigReadTags,
} from './read-params/read-params';
import { executeCommand, executeCommandObs } from './execute-command';
import { DEFAUL_CONFIG } from '../0-config/config';

const SEP = DEFAUL_CONFIG.SEP;

export const DEFAULT_OUT_DIR = './';
export const COMMITS_FILE_POSTFIX = '-commits.log';
export const COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';

export function readCommits(config: ConfigReadCommits) {
    const [cmd, out] = readCommitsCommand(config);
    executeCommand('readCommits', cmd);
    console.log(
        `====>>>> Commits read from repo in folder ${
            config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}

// returns an Observable which notifies when all git log commands on all repos have been executed, errors if one of the commands errors
export function readMultiReposCommits(config: ConfigReadMultiReposCommits) {
    const repoFolderPaths = config.repoFolderPaths;
    const basicConfig = { ...config };
    delete basicConfig.repoFolderPaths;
    const readSingleRepoConfigs = repoFolderPaths
        .map((repoFolderPath) => {
            const readSingleRepoConfig: ConfigReadCommits = {
                repoFolderPath,
                ...basicConfig,
            };
            return readSingleRepoConfig;
        })
        .map((config) => {
            const [cmd, out] = readCommitsCommand(config);
            return executeCommandObs('readCommits', cmd).pipe(
                tap({
                    complete: () => {
                        console.log(
                            `====>>>> Commits read from repo in folder ${
                                config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
                            }`,
                        );
                        console.log(`====>>>> Output saved on file ${out}`);
                    },
                }),
                map(() => out),
            );
        });
    return forkJoin(readSingleRepoConfigs);
}

export function readTags(config: ConfigReadTags) {
    const [cmd, out] = readTagsCommand(config);
    executeCommand('readTags', cmd);
    console.log(
        `====>>>> Tags read from repo in folder ${
            config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}

export function readBranchesGraph(config: ConfigReadTags) {
    const [cmd, out] = readBranchesGraphCommand(config);
    executeCommand('readBranchesGraph', cmd);
    console.log(
        `====>>>> Branches graph read from repo in folder ${
            config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}

// private function exported only for test purposes
export function readCommitsCommand(config: ConfigReadCommits) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const after = config.after ? `--after=${config.after}` : '';
    const before = config.before ? ` --before=${config.before} ` : '';
    let filter = '';
    if (config.filter) {
        const filters = config.filter.map((f) => `'${f}'`);
        filter = `${filters.join(' ')}`;
    }
    const _noRenames = config.noRenames ? '--no-renames ' : '';
    const _reverse = config.reverse ? '--reverse ' : '';
    let outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const outFile = getOutfileName(config.outFile, config.outFilePrefix, config.repoFolderPath, _postfix);
    const out = path.join(outDir, outFile);
    return [
        `git ${repoFolder} log --all --numstat --date=short --pretty=format:'${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p' ${_reverse}${_noRenames}${after}${before} ${filter} > ${out}`,
        out,
    ];
}

// private function exported only for test purposes
export function readTagsCommand(config: ConfigReadTags) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --no-walk --tags --pretty='${SEP}%h${SEP}%d${SEP}%s' --decorate=full > ${out}`, out];
}

// private function exported only for test purposes
export function readBranchesGraphCommand(config: ConfigReadBrachesGraph) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --all --graph --date=short --pretty=medium > ${out}`, out];
}

export function getOutfileName(outFile: string, outFilePrefix?: string, repoFolder?: string, postfix?: string) {
    const repoFolderName = path.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolder = isCurrentFolder ? path.parse(process.cwd()).name : repoFolder;
    const _prefix = outFilePrefix ?? '';
    return outFile ? outFile : `${_prefix}${path.parse(_repoFolder).name}${postfix}`;
}
