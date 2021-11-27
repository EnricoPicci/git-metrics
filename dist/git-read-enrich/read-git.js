"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutfileName = exports.readBranchesGraphCommand = exports.readTagsCommand = exports.readCommitsCommand = exports.readBranchesGraph = exports.readTags = exports.readMultiReposCommits = exports.readCommits = exports.COMMITS_FILE_REVERSE_POSTFIX = exports.COMMITS_FILE_POSTFIX = exports.DEFAULT_OUT_DIR = exports.SEP = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const execute_command_1 = require("./execute-command");
// SEP is the separator used to separate the various pieces of info of the commeit record
exports.SEP = '§§§';
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
function readBranchesGraph(config) {
    const [cmd, out] = readBranchesGraphCommand(config);
    (0, execute_command_1.executeCommand)('readBranchesGraph', cmd);
    console.log(`====>>>> Branches graph read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readBranchesGraph = readBranchesGraph;
// private function exported only for test purposes
function readCommitsCommand(config) {
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
    let outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? exports.COMMITS_FILE_REVERSE_POSTFIX : exports.COMMITS_FILE_POSTFIX;
    const outFile = getOutfileName(config.outFile, config.outFilePrefix, config.repoFolderPath, _postfix);
    const out = path.join(outDir, outFile);
    return [
        `git ${repoFolder} log --all --numstat --date=short --pretty=format:'${exports.SEP}%h${exports.SEP}%ad${exports.SEP}%aN${exports.SEP}%cN${exports.SEP}%cd${exports.SEP}%f${exports.SEP}%p' ${_reverse}${_noRenames}${after}${before} ${filter} > ${out}`,
        out,
    ];
}
exports.readCommitsCommand = readCommitsCommand;
// private function exported only for test purposes
function readTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : exports.DEFAULT_OUT_DIR;
    const outFile = getOutfileName(config.outFile, repoFolder, '-tags.log');
    const out = path.resolve(path.join(outDir, outFile));
    return [`git ${repoFolder} log --no-walk --tags --pretty='${exports.SEP}%h${exports.SEP}%d${exports.SEP}%s' --decorate=full > ${out}`, out];
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