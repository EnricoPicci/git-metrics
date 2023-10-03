import path = require('path');

import {
    ConfigReadCommits,
} from './read-params/read-params';
import { DEFAUL_CONFIG } from '../0-config/config';
import { COMMITS_FILE_POSTFIX, COMMITS_FILE_REVERSE_POSTFIX, readCommitWithFileNumstat$, writeCommitWithFileNumstat$ } from '../../../git-functions/commit.functions';

const SEP = DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;

export const DEFAULT_OUT_DIR = './';

// reads the commits with git log and return them as a stream of lines
export function readAndStreamCommitsNewProces(config: ConfigReadCommits, outFile: string, _writeFileOnly = false) {
    return readCommitWithFileNumstat$(config, outFile);
}

export function readCommitsNewProcess(config: ConfigReadCommits) {
    return writeCommitWithFileNumstat$(config);
}

export function buildGitOutfile(config: ConfigReadCommits) {
    let outDir = config.outDir ? config.outDir : DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const outFile = getOutfileName(config.outFile!, config.outFilePrefix, config.repoFolderPath, _postfix);
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
    let filters: any[] = [];
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

export function getOutfileName(outFile: string, outFilePrefix?: string, repoFolder?: string, postfix?: string) {
    const repoFolderName = path.parse(repoFolder!).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolder = isCurrentFolder ? path.parse(process.cwd()).name : repoFolder!;
    const _prefix = outFilePrefix ?? '';
    return outFile ? outFile : `${_prefix}${path.parse(_repoFolder).name}${postfix}`;
}
