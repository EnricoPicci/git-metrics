"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOutfileName = exports.buildGitOutfile = exports.COMMITS_FILE_REVERSE_POSTFIX = exports.COMMITS_FILE_POSTFIX = exports.DEFAULT_OUT_DIR = exports.readCommitsCommandWithArgs = exports.readCommitsCommand = exports.newCommitCompactFromGitlog = exports.newEmptyCommit = exports.readOneCommitFromLog$ = exports.writeCommitLog = exports.readCommitFromLog$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const config_1 = require("./config");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Fetches the commits for a Git repository within a specified date range and returns them as an Observable of
 * CommitCompact objects.
 * @param repoPath The path to the Git repository.
 * @param fromDate The start date of the date range. Defaults to the Unix epoch.
 * @param toDate The end date of the date range. Defaults to the current date and time.
 * @returns An Observable of CommitCompact objects representing the commits within the specified date range.
 * @throws An error if `repoPath` is not provided.
 */
function readCommitFromLog$(repoPath, fromDate = new Date(0), toDate = new Date(Date.now())) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an" --no-merges`;
    return (0, execute_command_1.executeCommandNewProcessToLinesObs)(`Read commits`, 'git', ['log', '--pretty=format:%H,%ad,%an', '--no-merges'], { cwd: repoPath }).pipe((0, rxjs_1.map)((commits) => commits.split('\n')), (0, rxjs_1.concatMap)((commits) => {
        return (0, rxjs_1.from)(commits);
    }), (0, rxjs_1.map)((commit) => {
        return newCommitCompactFromGitlog(commit);
    }), (0, rxjs_1.filter)((commit) => {
        return commit.date >= fromDate && commit.date <= toDate;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`);
        return rxjs_1.EMPTY;
    }));
}
exports.readCommitFromLog$ = readCommitFromLog$;
/**
 * Reads the commits from a Git repository and writes the output to a file.
 * @param params An object containing the parameters to control the read.
 * @returns The name of the file where the output is saved.
 */
function writeCommitLog(params) {
    const [cmd, out] = readCommitsCommand(params);
    (0, execute_command_1.executeCommand)('readCommits', cmd);
    console.log(`====>>>> Commits read from repo in folder ${params.repoFolderPath ?
        params.repoFolderPath :
        path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.writeCommitLog = writeCommitLog;
/**
 * Uses the git log command to fetch one commit given its sha.
 * Returns an Observable of a CommitCompact object representing the fetched commit.
 * Each CommitCompact object contains the commit sha, date, and author.
 * Throws an error if the madatory parameters are not passed or are empyt.
 * @param commitSha The sha of the commit to fetch.
 * @param repoPath The path to the Git repository.
 * @param verbose Whether or not to log errors to the console.
 * @returns An Observable of a CommitCompact object representing the fetched commit.
 * @throws An error if `commitSha` or `repoPath` is not provided.
 */
function readOneCommitFromLog$(commitSha, repoPath, verbose = true) {
    if (!commitSha.trim())
        throw new Error(`Path is mandatory`);
    if (!repoPath.trim())
        throw new Error(`Repo path is mandatory`);
    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return (0, execute_command_1.executeCommandObs)('run git-log to find parent', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((output) => {
        const commitCompact = newCommitCompactFromGitlog(output[0]);
        return commitCompact;
    }), (0, rxjs_1.catchError)((error) => {
        const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`;
        if (verbose)
            console.error(err);
        // in case of error we return an error
        throw new Error(err);
    }));
}
exports.readOneCommitFromLog$ = readOneCommitFromLog$;
/**
 * Returns a new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch,
 * i.e. 1970-01-01.
 * @returns A new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch.
 */
function newEmptyCommit() {
    const commit = {
        sha: '',
        date: new Date(0),
        author: '',
    };
    return commit;
}
exports.newEmptyCommit = newEmptyCommit;
/**
 * Returns a new `CommitCompact` object with the given sha, author and date starting from a string in the format
 * sha,date,author received from the git log command.
 * @param commitDataFromGitlog A string in the format sha,date,author received from the git log command.
 * @returns A new `CommitCompact` object with the specified sha, author and date.
 */
function newCommitCompactFromGitlog(commitDataFromGitlog) {
    const shaDateAuthor = commitDataFromGitlog.split(',');
    const commit = {
        sha: shaDateAuthor[0],
        date: new Date(shaDateAuthor[1]),
        author: shaDateAuthor[2],
    };
    return commit;
}
exports.newCommitCompactFromGitlog = newCommitCompactFromGitlog;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
const SEP = config_1.GIT_CONFIG.COMMIT_REC_SEP;
function readCommitsCommand(params) {
    const { cmd, args } = readCommitsCommandWithArgs(params, true);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    const out = buildGitOutfile(params);
    return [`${cmdWithArgs} > ${out}`, out];
}
exports.readCommitsCommand = readCommitsCommand;
function readCommitsCommandWithArgs(params, quotesForFilters) {
    const repoFolder = params.repoFolderPath ? ['-C', `${params.repoFolderPath}`] : [];
    const after = params.after ? `--after=${params.after.trim()}` : '';
    const before = params.before ? `--before=${params.before.trim()} ` : '';
    let filters = [];
    const _quotesForFilters = quotesForFilters ? `'` : '';
    if (params.filter) {
        filters = params.filter.map((f) => `${_quotesForFilters}${f}${_quotesForFilters}`);
    }
    const _noRenames = params.noRenames ? '--no-renames' : '';
    const _reverse = params.reverse ? '--reverse' : '';
    const _includeMergeCommits = params.includeMergeCommits ? '-m' : '';
    const _firstParent = params.firstParent ? '--first-parent' : '';
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
exports.DEFAULT_OUT_DIR = './';
exports.COMMITS_FILE_POSTFIX = '-commits.log';
exports.COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function buildGitOutfile(params) {
    let outDir = params.outDir ? params.outDir : exports.DEFAULT_OUT_DIR;
    outDir = path_1.default.resolve(outDir);
    const _postfix = params.reverse ? exports.COMMITS_FILE_REVERSE_POSTFIX : exports.COMMITS_FILE_POSTFIX;
    const outFile = buildOutfileName(params.outFile, params.outFilePrefix, params.repoFolderPath, _postfix);
    const out = path_1.default.join(outDir, outFile);
    return out;
}
exports.buildGitOutfile = buildGitOutfile;
function buildOutfileName(outFile = '', repoFolder = '', prefix, postfix) {
    const repoFolderName = path_1.default.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path_1.default.parse(process.cwd()).name : repoFolderName;
    const _prefix = prefix !== null && prefix !== void 0 ? prefix : '';
    const _postfix = postfix !== null && postfix !== void 0 ? postfix : '';
    return outFile ? outFile : `${_prefix}${(_repoFolderName)}${_postfix}`;
}
exports.buildOutfileName = buildOutfileName;
//# sourceMappingURL=commit.functions.js.map