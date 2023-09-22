"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutfileName = exports.readBranchesGraphCommand = exports.readTagsCommand = exports.readCommitsCommandWithArgs = exports.readCommitsCommand = exports.buildGitOutfile = exports.readBranchesGraph = exports.readTags = exports.readMultiReposCommits = exports.readCommitsNewProcess = exports.readAndStreamCommitsNewProces = exports.readCommitsObs = exports.readCommits = exports.COMMITS_FILE_REVERSE_POSTFIX = exports.COMMITS_FILE_POSTFIX = exports.DEFAULT_OUT_DIR = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const operators_1 = require("rxjs/operators");
const execute_command_1 = require("../../../0-tools/execute-command/execute-command");
const config_1 = require("../0-config/config");
const SEP = config_1.DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;
exports.DEFAULT_OUT_DIR = './';
exports.COMMITS_FILE_POSTFIX = '-commits.log';
exports.COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function readCommits(config) {
    const [cmd, out] = readCommitsCommand(config);
    (0, execute_command_1.executeCommand)('readCommits', cmd);
    console.log(`====>>>> Commits read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readCommits = readCommits;
function readCommitsObs(config) {
    const [cmd, out] = readCommitsCommand(config);
    return (0, execute_command_1.executeCommandObs)('readCommits', cmd).pipe((0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Commits read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
            console.log(`====>>>> Output saved on file ${out}`);
        },
    }), (0, operators_1.map)(() => out));
}
exports.readCommitsObs = readCommitsObs;
// reads the commits with git log and return them as a stream of lines
function readAndStreamCommitsNewProces(config, outFile, writeFileOnly = false) {
    const { cmd, args } = readCommitsCommandWithArgs(config, false);
    const _readCommits = (0, execute_command_1.executeCommandNewProcessToLinesObs)('readCommits', cmd, args).pipe((0, operators_1.share)());
    const emitOutFileOrIgnoreElements = writeFileOnly
        ? (0, rxjs_1.pipe)((0, operators_1.last)(), (0, operators_1.map)(() => outFile))
        : (0, operators_1.ignoreElements)();
    const _writeFile = (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, operators_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }), (0, operators_1.concatMap)(() => _readCommits), (0, operators_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), emitOutFileOrIgnoreElements);
    const _streams = [_writeFile];
    if (!writeFileOnly) {
        _streams.push(_readCommits);
    }
    return (0, rxjs_1.merge)(..._streams);
}
exports.readAndStreamCommitsNewProces = readAndStreamCommitsNewProces;
function readCommitsNewProcess(config) {
    const [cmd, out] = readCommitsCommand(config);
    return (0, execute_command_1.executeCommandInShellNewProcessObs)('writeCommitsToFile', cmd).pipe((0, operators_1.ignoreElements)(), (0, operators_1.defaultIfEmpty)(out), (0, operators_1.tap)({
        next: (outFile) => {
            console.log(`====>>>> Commits read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
            console.log(`====>>>> Output saved on file ${outFile}`);
        },
    }));
}
exports.readCommitsNewProcess = readCommitsNewProcess;
// returns an Observable which notifies when all git log commands on all repos have been executed, errors if one of the commands errors
function readMultiReposCommits(config) {
    const repoFolderPaths = config.repoFolderPaths;
    const basicConfig = Object.assign({}, config);
    delete basicConfig.repoFolderPaths;
    const readSingleRepoConfigs = repoFolderPaths
        .map((repoFolderPath) => {
        const readSingleRepoConfig = Object.assign({ repoFolderPath }, basicConfig);
        return readSingleRepoConfig;
    })
        .map((config) => readCommitsObs(config));
    return (0, rxjs_1.forkJoin)(readSingleRepoConfigs);
}
exports.readMultiReposCommits = readMultiReposCommits;
function readTags(config) {
    const [cmd, out] = readTagsCommand(config);
    (0, execute_command_1.executeCommand)('readTags', cmd);
    console.log(`====>>>> Tags read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readTags = readTags;
function readBranchesGraph(config) {
    const [cmd, out] = readBranchesGraphCommand(config);
    (0, execute_command_1.executeCommand)('readBranchesGraph', cmd);
    console.log(`====>>>> Branches graph read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readBranchesGraph = readBranchesGraph;
function buildGitOutfile(config) {
    let outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? exports.COMMITS_FILE_REVERSE_POSTFIX : exports.COMMITS_FILE_POSTFIX;
    const outFile = getOutfileName(config.outFile, config.outFilePrefix, config.repoFolderPath, _postfix);
    const out = path.join(outDir, outFile);
    return out;
}
exports.buildGitOutfile = buildGitOutfile;
// private function exported only for test purposes
function readCommitsCommand(config) {
    const { cmd, args } = readCommitsCommandWithArgs(config, true);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    const out = buildGitOutfile(config);
    return [`${cmdWithArgs} > ${out}`, out];
}
exports.readCommitsCommand = readCommitsCommand;
function readCommitsCommandWithArgs(config, quotesForFilters) {
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
exports.readCommitsCommandWithArgs = readCommitsCommandWithArgs;
// private function exported only for test purposes
function readTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --no-walk --tags --pretty='${SEP}%h${SEP}%d${SEP}%s' --decorate=full > ${out}`, out];
}
exports.readTagsCommand = readTagsCommand;
// private function exported only for test purposes
function readBranchesGraphCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --all --graph --date=short --pretty=medium > ${out}`, out];
}
exports.readBranchesGraphCommand = readBranchesGraphCommand;
function getOutfileName(outFile, outFilePrefix, repoFolder, postfix) {
    const repoFolderName = path.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolder = isCurrentFolder ? path.parse(process.cwd()).name : repoFolder;
    const _prefix = outFilePrefix !== null && outFilePrefix !== void 0 ? outFilePrefix : '';
    return outFile ? outFile : `${_prefix}${path.parse(_repoFolder).name}${postfix}`;
}
exports.getOutfileName = getOutfileName;
//# sourceMappingURL=read-git.js.map