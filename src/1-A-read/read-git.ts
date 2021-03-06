import path = require('path');
import { forkJoin, merge, Observable, of, pipe } from 'rxjs';
import { appendFileObs, deleteFileObs } from 'observable-fs';

import { catchError, concatMap, defaultIfEmpty, ignoreElements, last, map, share, tap } from 'rxjs/operators';
import {
    ConfigReadBrachesGraph,
    ConfigReadCommits,
    ConfigReadMultiReposCommits,
    ConfigReadTags,
} from './read-params/read-params';
import {
    executeCommand,
    executeCommandInShellNewProcessObs,
    executeCommandNewProcessToLinesObs,
    executeCommandObs,
} from './execute-command';
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

export function readCommitsObs(config: ConfigReadCommits) {
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
}

// reads the commits with git log and return them as a stream of lines
export function readAndStreamCommitsNewProces(config: ConfigReadCommits, outFile: string, writeFileOnly = false) {
    const { cmd, args } = readCommitsCommandWithArgs(config, false);
    const _readCommits = executeCommandNewProcessToLinesObs('readCommits', cmd, args).pipe(share());

    const emitOutFileOrIgnoreElements = writeFileOnly
        ? pipe(
              last(),
              map(() => outFile),
          )
        : ignoreElements();
    const _writeFile = deleteFileObs(outFile).pipe(
        catchError((err) => {
            if (err.code === 'ENOENT') {
                // emit something so that the next operation can continue
                return of(null);
            }
        }),
        concatMap(() => _readCommits),
        concatMap((line) => {
            const _line = `${line}\n`;
            return appendFileObs(outFile, _line);
        }),
        emitOutFileOrIgnoreElements,
    );
    const _streams: Observable<never | string>[] = [_writeFile];
    if (!writeFileOnly) {
        _streams.push(_readCommits);
    }
    return merge(..._streams);
}

export function readCommitsNewProcess(config: ConfigReadCommits) {
    const [cmd, out] = readCommitsCommand(config);
    return executeCommandInShellNewProcessObs('writeCommitsToFile', cmd).pipe(
        ignoreElements(),
        defaultIfEmpty(out),
        tap({
            next: (outFile) => {
                console.log(
                    `====>>>> Commits read from repo in folder ${
                        config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name
                    }`,
                );
                console.log(`====>>>> Output saved on file ${outFile}`);
            },
        }),
    );
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
        .map((config) => readCommitsObs(config));
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

export function buildGitOutfile(config: ConfigReadCommits) {
    let outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const outFile = getOutfileName(config.outFile, config.outFilePrefix, config.repoFolderPath, _postfix);
    const out = path.join(outDir, outFile);
    return out;
}

// private function exported only for test purposes
export function readCommitsCommand(config: ConfigReadCommits) {
    const { cmd, args } = readCommitsCommandWithArgs(config, true);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    const out = buildGitOutfile(config);
    return [`${cmdWithArgs} > ${out}`, out];
}
export function readCommitsCommandWithArgs(config: ConfigReadCommits, quotesForFilters: boolean) {
    const repoFolder = config.repoFolderPath ? ['-C', `${config.repoFolderPath}`] : [];
    const after = config.after ? `--after=${config.after.trim()}` : '';
    const before = config.before ? `--before=${config.before.trim()} ` : '';
    let filters = [];
    const _quotesForFilters = quotesForFilters ? `'` : '';
    if (config.filter) {
        filters = config.filter.map((f) => `${_quotesForFilters}${f}${_quotesForFilters}`);
    }
    const _noRenames = config.noRenames ? '--no-renames' : '';
    const _reverse = config.reverse ? '--reverse' : '';
    const _includeMergeCommits = config.includeMergeCommits ? '-m' : '';
    const _firstParent = config.firstParent ? '--first-parent' : '';

    const _args = [
        ...repoFolder,
        'log',
        '--all',
        '--numstat',
        '--date=short',
        `--pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p`,
        _reverse,
        _noRenames,
        _includeMergeCommits,
        _firstParent,
        after,
        before,
        ...filters,
    ];
    const args = _args.filter((a) => {
        const resp = !!a && a.length > 0;
        return resp;
    });
    return {
        cmd: `git`,
        args,
    };
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
