"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMITS_FILE_REVERSE_POSTFIX = exports.COMMITS_FILE_POSTFIX = exports.newEmptyCommitCompact = exports.writeCommitEnrichedLog$ = exports.readCommitWithFileNumstatFromLog$ = exports.writeCommitLog = exports.readOneCommitCompactFromLog$ = exports.readCommitCompactFromLog$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const commit_model_1 = require("./commit.model");
const config_1 = require("./config");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Reads the commits from a Git repository within a specified date range and returns them as an Observable of
 * CommitCompact objects.
 * CommitCompact objects are a minimal representation of commit records containing the commit sha, date, and author.
 * @param repoPath The path to the Git repository.
 * @param fromDate The start date of the date range. Defaults to the Unix epoch.
 * @param toDate The end date of the date range. Defaults to the current date and time.
 * @returns An Observable of CommitCompact objects representing the commits within the specified date range.
 * @throws An error if `repoPath` is not provided.
 */
function readCommitCompactFromLog$(repoPath, fromDate = new Date(0), toDate = new Date(Date.now()), noMerges = true) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const _noMerges = noMerges ? '--no-merges' : '';
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an" ${_noMerges}`;
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
exports.readCommitCompactFromLog$ = readCommitCompactFromLog$;
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
function readOneCommitCompactFromLog$(commitSha, repoPath, verbose = true) {
    if (!commitSha.trim())
        throw new Error(`Path is mandatory`);
    if (!repoPath.trim())
        throw new Error(`Repo path is mandatory`);
    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return (0, execute_command_1.executeCommandObs)('read one commit from log', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((output) => {
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
exports.readOneCommitCompactFromLog$ = readOneCommitCompactFromLog$;
/**
 * Reads the commits from a Git repository and writes the output to a file.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to control the read.
 * @returns The name of the file where the output is saved.
 */
function writeCommitLog(params) {
    const [cmd, out] = writeCommitEnrichedLogCommand(params);
    (0, execute_command_1.executeCommand)('write commit log', cmd);
    console.log(`====>>>> Commits read from repo in folder ${params.repoFolderPath ?
        params.repoFolderPath :
        path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.writeCommitLog = writeCommitLog;
function readCommitWithFileNumstatFromLog$(params, outFile = '') {
    const args = readCommitWithFileNumstaFromLogCommandWithArgs(params, false);
    // _readCommitsData$ is a stream of lines which represent the result of the git log command (i.e. data about the commits)
    // it is shared since it is the upstream for two streams which are merged at the end of the function
    // if we do not share it, then the git log command is executed twice
    const _readCommitsData$ = (0, execute_command_1.executeCommandNewProcessToLinesObs)('readCommits', 'git', args).pipe((0, rxjs_1.share)());
    // _readCommitWithFileNumstat$ is a stream that derives from the upstream of lines notified by _readCommitsData$
    // and transform it into a stream of CommitWithFileNumstat objects
    const _readCommitWithFileNumstat$ = _readCommitsData$.pipe((0, rxjs_1.filter)((line) => line.length > 0), toCommitsWithFileNumstatdata());
    // _writeCommitLog$ is a stream which writes the commits to a file if an outFile is provided
    // if an outFile is provided, _writeCommitLog is a stream that writes the commits to the outFile silently
    // (silently means that it does not emit anything and completes when the writing is completed)
    // if no outFile, _writeCommitLog is the EMPTY stream, i.e. a stream that emits nothing and immediately completes
    const _writeCommitLog$ = outFile ? (0, observable_fs_1.deleteFileObs)(outFile).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            // emit something so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }), (0, rxjs_1.concatMap)(() => _readCommitsData$), 
    // filter((line) => line.length > 0),
    (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), (0, rxjs_1.ignoreElements)()) :
        rxjs_1.EMPTY;
    return (0, rxjs_1.merge)(_readCommitWithFileNumstat$, _writeCommitLog$);
}
exports.readCommitWithFileNumstatFromLog$ = readCommitWithFileNumstatFromLog$;
/**
 * Executes the `writeCommitLogCommand` function to write the commit log to a file and returns
 * an Observable that emits the name of the file where the output is saved.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to pass to the `writeCommitLogCommand` function.
 * @returns An Observable that emits the name of the file where the output is saved.
 */
function writeCommitEnrichedLog$(params) {
    const [cmd, out] = writeCommitEnrichedLogCommand(params);
    return (0, execute_command_1.executeCommandObs)('write commit enriched log', cmd).pipe((0, rxjs_1.tap)({
        complete: () => {
            console.log(`====>>>> Commits read from repo in folder ${params.repoFolderPath ? params.repoFolderPath : path_1.default.parse(process.cwd()).name}`);
            console.log(`====>>>> Output saved on file ${out}`);
        },
    }), (0, rxjs_1.map)(() => out));
}
exports.writeCommitEnrichedLog$ = writeCommitEnrichedLog$;
/**
 * Returns a new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch,
 * i.e. 1970-01-01.
 * @returns A new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch.
 */
function newEmptyCommitCompact() {
    const commit = {
        sha: '',
        date: new Date(0),
        author: '',
    };
    return commit;
}
exports.newEmptyCommitCompact = newEmptyCommitCompact;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
const SEP = config_1.GIT_CONFIG.COMMIT_REC_SEP;
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
function writeCommitEnrichedLogCommand(params) {
    const args = readCommitWithFileNumstaFromLogCommandWithArgs(params, true);
    const cmdWithArgs = `git ${args.join(' ')}`;
    const out = buildGitOutfile(params);
    return [`${cmdWithArgs} > ${out}`, out];
}
/**
 * Returns an object containing the command and arguments to execute the git log command with the specified parameters.
 * The command returns the commit history enriched with the number of lines added and removed for each file in each commit.
 * @param params An object containing the parameters to pass to the git log command.
 * @param quotesForFilters A boolean indicating whether or not to use quotes for the filters.
 * @returns An array of arguments to execute the git log command with the specified parameters.
 */
function readCommitWithFileNumstaFromLogCommandWithArgs(params, quotesForFilters) {
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
    return args;
}
const DEFAULT_OUT_DIR = './';
exports.COMMITS_FILE_POSTFIX = '-commits.log';
exports.COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function buildGitOutfile(params) {
    let outDir = params.outDir ? params.outDir : DEFAULT_OUT_DIR;
    outDir = path_1.default.resolve(outDir);
    const _postfix = params.reverse ? exports.COMMITS_FILE_REVERSE_POSTFIX : exports.COMMITS_FILE_POSTFIX;
    const outFile = buildOutfileName(params.outFile, params.repoFolderPath, params.outFilePrefix, _postfix);
    const out = path_1.default.join(outDir, outFile);
    return out;
}
function buildOutfileName(outFile = '', repoFolder = '', prefix = '', postfix = '') {
    const repoFolderName = path_1.default.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path_1.default.parse(process.cwd()).name : repoFolderName;
    return outFile ? outFile : `${prefix}${(_repoFolderName)}${postfix}`;
}
function toCommitsWithFileNumstatdata(logFilePath) {
    return (0, rxjs_1.pipe)(commitLines(logFilePath), (0, rxjs_1.map)((lines) => {
        const commit = (0, commit_model_1.newCommitWithFileNumstats)(lines);
        return commit;
    }));
}
// Custom operator which splits the content of a git log into buffers of lines where each buffer contains all the lines
// relative to a single git commit
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
function commitLines(logFilePath) {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let buffer;
            const subscription = source.subscribe({
                next: (line) => {
                    const isStartOfBuffer = line.length > 0 && line.slice(0, SEP.length) === SEP;
                    if (isStartOfBuffer) {
                        if (buffer) {
                            subscriber.next(buffer);
                        }
                        buffer = [];
                    }
                    buffer.push(line);
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    if (!buffer) {
                        const logPathMsg = logFilePath ? `in file ${logFilePath}` : '';
                        console.warn(`!!!!!!!!!!!!!>>>>  No commits found ${logPathMsg}`);
                        subscriber.complete();
                    }
                    subscriber.next(buffer);
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
// ALTERNATIVE VERSION
// This is an alternative version of the above function which does use only rxJs operators and not custom operators
//
// export function splitCommits(logFilePath: string) {
//     let buffer: string[] = [];
//     const lastCommit = new Subject<Array<string>>();
//     const _commits = readLineObs(logFilePath).pipe(
//         filter((line) => line.length > 0),
//         map((line) => {
//             if (line.slice(0, SEP.length) === SEP) {
//                 const commit = buffer;
//                 buffer = [line];
//                 return commit;
//             }
//             buffer.push(line);
//             return null;
//         }),
//         filter((buffer) => !!buffer),
//         tap({
//             complete: () => {
//                 lastCommit.next(buffer);
//                 lastCommit.complete();
//             },
//         }),
//         skip(1),
//     );
//     return merge(_commits, lastCommit);
// }
//# sourceMappingURL=commit.functions.js.map