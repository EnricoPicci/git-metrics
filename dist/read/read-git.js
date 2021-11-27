"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.txt'  > ./test-data/output/git-repo.log
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutfileName = exports.readTagsCommand = exports.readCommitsCommand = exports.readTags = exports.readMultiReposCommits = exports.readCommits = exports.COMMITS_FILE_POSTFIX = exports.DEFAULT_OUT_DIR = exports.SEP = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const execute_command_1 = require("./execute-command");
// SEP is the separator used to separate the various pieces of info of the commeit record
exports.SEP = '§§§';
exports.DEFAULT_OUT_DIR = './';
exports.COMMITS_FILE_POSTFIX = '-commits.log';
function readCommits(config) {
    const [cmd, out] = readCommitsCommand(config);
    (0, execute_command_1.executeCommand)('readCommits', cmd);
    console.log(`====>>>> Commits read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readCommits = readCommits;
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
        .map((config) => {
        const [cmd, out] = readCommitsCommand(config);
        return (0, execute_command_1.executeCommandObs)('readCommits', cmd).pipe((0, operators_1.tap)({
            complete: () => {
                console.log(`====>>>> Commits read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
                console.log(`====>>>> Output saved on file ${out}`);
            },
        }), (0, operators_1.map)(() => out));
    });
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
// private function exported only for test purposes
function readCommitsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const after = config.after ? `--after=${config.after}` : '';
    let filter = '';
    if (config.filter) {
        const filters = config.filter.map((f) => `'${f}'`);
        filter = `${filters.join(' ')}`;
    }
    const outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, config.outFilePrefix, config.repoFolderPath, exports.COMMITS_FILE_POSTFIX);
    const out = path.join(outDir, outFile);
    return [
        `git ${repoFolder} log --all --numstat --date=short --pretty=format:'${exports.SEP}%h${exports.SEP}%ad${exports.SEP}%aN${exports.SEP}%cN${exports.SEP}%cd${exports.SEP}%s' --no-renames ${after} ${filter} > ${out}`,
        out,
    ];
}
exports.readCommitsCommand = readCommitsCommand;
// private function exported only for test purposes
function readTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.join(outDir, outFile);
    return [`git ${repoFolder} log --no-walk --tags --pretty='${exports.SEP}%h${exports.SEP}%d${exports.SEP}%s' --decorate=full > ${out}`, out];
}
exports.readTagsCommand = readTagsCommand;
function getOutfileName(outFile, outFilePrefix, repoFolder, postfix) {
    const _repoFolder = repoFolder ? repoFolder : path.parse(process.cwd()).name;
    const _prefix = outFilePrefix !== null && outFilePrefix !== void 0 ? outFilePrefix : '';
    return outFile ? outFile : `${_prefix}${path.parse(_repoFolder).name}${postfix}`;
}
exports.getOutfileName = getOutfileName;
//# sourceMappingURL=read-git.js.map