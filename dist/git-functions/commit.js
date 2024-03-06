"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitLines = exports.COMMITS_FILE_REVERSE_POSTFIX = exports.COMMITS_FILE_POSTFIX = exports.writeCommitWithFileNumstatCommand = exports.newCommitCompactFromGitlog = exports.SEP = exports.countCommits$ = exports.repoPathAndFromDates$ = exports.allCommits$ = exports.checkout$ = exports.commitClosestToDate$ = exports.commitAtDateOrAfter$ = exports.commitAtDateOrBefore$ = exports.newEmptyCommitCompact = exports.writeCommitWithFileNumstat$ = exports.readCommitWithFileNumstat$ = exports.writeCommitWithFileNumstat = exports.readOneCommitCompact$ = exports.readCommitCompactWithUrlAndParentDate$ = exports.readCommitCompact$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const commit_model_1 = require("./commit.model");
const config_1 = require("./config");
const file_name_utils_1 = require("./utils/file-name-utils");
const config_2 = require("../config");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const commit_url_1 = require("./commit-url");
const date_functions_1 = require("../tools/dates/date-functions");
const errors_1 = require("./errors");
const errors_2 = require("./errors");
const repo_creation_date_1 = require("./repo-creation-date");
const repo_1 = require("./repo");
const repo_errors_1 = require("./repo.errors");
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
function readCommitCompact$(repoPath, fromDate = new Date(0), toDate = new Date(Date.now()), noMerges = true) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const _noMerges = noMerges ? '--no-merges' : '';
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an,%s" ${_noMerges}`;
    const options = [
        'log', '--pretty=format:%H,%ad,%an,%s',
        '--after=' + (0, date_functions_1.toYYYYMMDD)(fromDate), '--before=' + (0, date_functions_1.toYYYYMMDD)(toDate)
    ];
    if (noMerges)
        options.push('--no-merges');
    return (0, execute_command_1.executeCommandNewProcessToLinesObs)(`Read commits`, 'git', options, { cwd: repoPath }).pipe((0, rxjs_1.map)((commits) => {
        return commits.split('\n');
    }), (0, rxjs_1.concatMap)((commits) => {
        return (0, rxjs_1.from)(commits);
    }), (0, rxjs_1.filter)((commit) => {
        return commit.trim().length > 0;
    }), (0, rxjs_1.map)((commit) => {
        return newCommitCompactFromGitlog(commit, repoPath);
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`);
        return rxjs_1.EMPTY;
    }));
}
exports.readCommitCompact$ = readCommitCompact$;
/**
 * Reads the commits in a Git repository for a certain period and returns an Observable of CommitCompactWithUrlAndParentDate objects.
 * The function fills the url for the commit and reads the parent commit of each commit and adds the parent date to the resulting object.
 * @param repoPath The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param noMerges A boolean indicating whether to exclude merge commits. Defaults to true.
 * @returns An Observable of CommitCompactWithUrlAndParentDate objects.
 */
function readCommitCompactWithUrlAndParentDate$(repoPath, fromDate = new Date(0), toDate = new Date(Date.now()), noMerges = true) {
    return readCommitCompact$(repoPath, fromDate, toDate, noMerges).pipe((0, rxjs_1.concatMap)((commit) => {
        return (0, commit_url_1.getGitlabCommitUrl)(repoPath, commit.sha).pipe((0, rxjs_1.map)((commitUrl) => {
            return { commit, commitUrl };
        }));
    }), (0, rxjs_1.concatMap)(({ commit, commitUrl }) => {
        const parentCommitSha = `${commit.sha}^1`;
        return readOneCommitCompact$(parentCommitSha, repoPath).pipe((0, rxjs_1.catchError)(err => {
            // if the error is because the commit has no parent, then we set the parent date to the beginning of time
            if (err === errors_2.ERROR_UNKNOWN_REVISION_OR_PATH) {
                const commitWithParentDate = Object.assign(Object.assign({}, commit), { parentDate: new Date(0), commitUrl });
                return (0, rxjs_1.of)(commitWithParentDate);
            }
            // in case of error we return an empty commit
            console.log(err);
            return (0, rxjs_1.of)(newEmptyCommitCompact());
        }), (0, rxjs_1.map)((parentCommit) => {
            const commitWithParentDate = Object.assign(Object.assign({}, commit), { parentDate: parentCommit.date, commitUrl });
            return commitWithParentDate;
        }));
    }));
}
exports.readCommitCompactWithUrlAndParentDate$ = readCommitCompactWithUrlAndParentDate$;
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
function readOneCommitCompact$(commitSha, repoPath, verbose = true) {
    if (!commitSha.trim())
        throw new Error(`Path is mandatory`);
    if (!repoPath.trim())
        throw new Error(`Repo path is mandatory`);
    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return (0, execute_command_1.executeCommandObs)('read one commit from log', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((output) => {
        const commitCompact = newCommitCompactFromGitlog(output[0], repoPath);
        return commitCompact;
    }), (0, rxjs_1.catchError)((error) => {
        if ((0, errors_1.isUnknownRevisionError)(error)) {
            throw errors_2.ERROR_UNKNOWN_REVISION_OR_PATH;
        }
        const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`;
        if (verbose)
            console.error(err);
        // in case of error we return an error
        throw new Error(err);
    }));
}
exports.readOneCommitCompact$ = readOneCommitCompact$;
/**
 * Reads the commits from a Git repository and writes the output to a file.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to control the read.
 * @returns The name of the file where the output is saved.
 */
function writeCommitWithFileNumstat(params) {
    const [cmd, out] = writeCommitWithFileNumstatCommand(params);
    (0, execute_command_1.executeCommand)('write commit log', cmd);
    console.log(`====>>>> Commits read from repo in folder ${params.repoFolderPath ?
        params.repoFolderPath :
        path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.writeCommitWithFileNumstat = writeCommitWithFileNumstat;
/**
 * Reads the commits from a Git repository enriched with the number of lines added and removed for each file in
 * each commit, and writes the output to a file if an outFile is provided.
 * The function returns an Observable that emits a stream of `CommitWithFileNumstat` objects
 * representing the commits enriched with the number of lines added and removed for each file in each commit.
 * @param params An object containing the parameters to pass to the `readCommitWithFileNumstaFromLogCommandWithArgs` function.
 * @param outFile The path to the file where the output should be saved. If not provided, the output is not saved to a file.
 * @returns An Observable that emits a stream of `CommitWithFileNumstat` objects representing the commits enriched with the number of lines added and removed for each file in each commit.
 */
function readCommitWithFileNumstat$(params, outFile = '') {
    const args = readCommitWithFileNumstaCommandWithArgs(params, false);
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
    const _writeCommitLog$ = outFile ? (0, delete_file_ignore_if_missing_1.deleteFile$)(outFile).pipe((0, rxjs_1.concatMap)(() => _readCommitsData$), 
    // filter((line) => line.length > 0),
    (0, rxjs_1.concatMap)((line) => {
        const _line = `${line}\n`;
        return (0, observable_fs_1.appendFileObs)(outFile, _line);
    }), (0, rxjs_1.ignoreElements)()) :
        rxjs_1.EMPTY;
    return (0, rxjs_1.merge)(_readCommitWithFileNumstat$, _writeCommitLog$);
}
exports.readCommitWithFileNumstat$ = readCommitWithFileNumstat$;
/**
 * Executes the `writeCommitLogCommand` function to write the commit log to a file and returns
 * an Observable that emits the name of the file where the output is saved.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to pass to the `writeCommitLogCommand` function.
 * @returns An Observable that emits the name of the file where the output is saved.
 */
function writeCommitWithFileNumstat$(params) {
    const [cmd, out] = writeCommitWithFileNumstatCommand(params);
    return (0, execute_command_1.executeCommandObs)('write commit enriched log', cmd).pipe((0, rxjs_1.tap)({
        complete: () => {
            console.log(`====>>>> Commits read from repo in folder ${params.repoFolderPath ? params.repoFolderPath : path_1.default.parse(process.cwd()).name}`);
            console.log(`====>>>> Output saved on file ${out}`);
        },
    }), (0, rxjs_1.map)(() => out));
}
exports.writeCommitWithFileNumstat$ = writeCommitWithFileNumstat$;
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
        subject: '',
        repo: ''
    };
    return commit;
}
exports.newEmptyCommitCompact = newEmptyCommitCompact;
/**
 * Fetches the commit SHA for a Git repository at a specific date and returns an Observable that emits the commit SHA.
 * If a commit is not found, it throws an error. This is the case when there is no commit at the date or before it.
 * @param repoPath The path to the Git repository.
 * @param date The date to fetch the commit SHA at.
 * @param branchName The branch to fetch the commit SHA from.
 * @returns An Observable that emits the commit SHA for the repository at the specified date.
 * @throws An error if the commit SHA could not be fetched.
 */
function commitAtDateOrBefore$(repoPath, date, branchName, options) {
    // convert date to YYYY-MM-DD format
    const dateString = (0, date_functions_1.toYYYYMMDD)(date);
    const gitCommand = `cd ${repoPath} && git log -n 1 --before="${dateString}" --format=%H%ci ${branchName}`;
    return (0, execute_command_1.executeCommandObs)(`read the commit sha at date ${dateString} for branch ${branchName}`, gitCommand, options).pipe((0, rxjs_1.map)(commitInfoString => {
        return commitInfoString.trim();
    }), (0, rxjs_1.tap)((commitInfo) => {
        if (!commitInfo) {
            const errMsg = `Error: while reading the commit sha at date ${dateString} for branch ${branchName} in repo "${repoPath}"
                we expected to have a commit sha but we got an empty string.
                This probably means that there is no commit at date ${dateString} or before it for branch ${branchName} in repo "${repoPath}"
                Command erroring: "${gitCommand}"`;
            throw new repo_errors_1.GitError(errMsg, repoPath, gitCommand);
        }
    }), (0, rxjs_1.map)(commitInfo => {
        // commitsInfo is a string containing the concatenation of all the commits in the format sha, date joined by a newline
        // need to take just the first line
        // remove the last newline character
        const firstLine = commitInfo.split('\n')[0];
        return splitShaDate(firstLine);
    }));
}
exports.commitAtDateOrBefore$ = commitAtDateOrBefore$;
/**
 * This function fetches the commit SHA for a Git repository at a specified date or after and returns an Observable
 * that emits the commit SHA and the date.
 * If a commit is not found at the specified date, then the function fetches the first commit after the date.
 * The function throws an error if no commit is found at or after the specified date.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to fetch the commit SHA.
 * @param {string} branchName - The name of the branch for which to fetch the commit SHA.
 * @returns {Observable} An Observable that emits the commit SHA and the date of the commit at or after the specified date.
 */
function commitAtDateOrAfter$(repoPath, date, branchName) {
    // convert date to YYYY-MM-DD format
    const dateString = (0, date_functions_1.toYYYYMMDD)(date);
    // to find the first commit after a certain date we have to get the commits in reverse order and then take the first one
    // the option -n 1 does not work since git first applies the -n 1 option and then the --reverse option, which means that
    // it take the first commit in the normal order (which is the last one) and then reverses the order of the commits, with
    // the result that we get the last commit and not the first commit after the date
    // https://stackoverflow.com/a/5188990/5699993
    const gitCommand = `cd ${repoPath} && git log --reverse --after="${dateString}" --format=%H%ci ${branchName}`;
    return (0, execute_command_1.executeCommandObs)(`read the commit sha at date ${dateString} for branch ${branchName}`, gitCommand).pipe((0, rxjs_1.map)(commitSha => {
        return commitSha.trim();
    }), (0, rxjs_1.tap)((commitSha) => {
        if (!commitSha) {
            throw new Error(`Error: while reading the commit sha at date ${dateString} for branch ${branchName} in repo "${repoPath}"
                    we expected to have a commit sha but we got an empty string.
                    This probably means that there is no commit at date ${dateString} or after it for branch ${branchName} in repo "${repoPath}"
                    Command erroring: "${gitCommand}"`);
        }
    }), (0, rxjs_1.map)(commitsInfo => {
        // commitsInfo is a string containing the concatenation of all the commits in the format sha, date joined by a newline
        // need to take just the first line
        const firstLine = commitsInfo.split('\n')[0];
        return splitShaDate(firstLine);
    }));
}
exports.commitAtDateOrAfter$ = commitAtDateOrAfter$;
/**
 * This function fetches the commit SHA for a Git repository at a specified date and returns an Observable that emits the commit SHA
 * and the date of the commit.
 * If a commit is not found at the specified date, then the function fetches the commit closest to the date and returns an Observable
 * that emits the commit SHA and the date of the commit.
 *
 * @param {string} repoPath - The path to the Git repository.
 * @param {Date} date - The date for which to fetch the commit SHA.
 * @param {string} branchName - The name of the branch for which to fetch the commit SHA.
 * @param {boolean} beforeWhenEqual - A flag indicating whether to fetch the commit before the date when the distances to the date are equal.
 * @returns {Observable} An Observable that emits the commit SHA and the date of the commit closest to the specified date.
 */
function commitClosestToDate$(repoPath, date, branchName, beforeWhenEqual = true) {
    const commitBeforeDate$ = commitAtDateOrBefore$(repoPath, date, branchName);
    const commitAfterDate$ = commitAtDateOrAfter$(repoPath, date, branchName);
    return (0, rxjs_1.forkJoin)([commitBeforeDate$, commitAfterDate$]).pipe((0, rxjs_1.map)(([[beforeSha, beforeDate], [afterSha, afterDate]]) => {
        // calculate the distance between the date and the dates of the commits
        const beforeDateDistance = Math.abs(new Date(beforeDate).getTime() - date.getTime());
        const afterDateDistance = Math.abs(new Date(afterDate).getTime() - date.getTime());
        // return the commit sha of the commit closest to the date - if the distance is equal, return the date
        // before if beforeWhenEqual is true, otherwise return the date after
        if (beforeDateDistance === afterDateDistance) {
            return beforeWhenEqual ? [beforeSha, beforeDate] : [afterSha, afterDate];
        }
        return beforeDateDistance < afterDateDistance ? [beforeSha, beforeDate] : [afterSha, afterDate];
    }));
}
exports.commitClosestToDate$ = commitClosestToDate$;
const splitShaDate = (commitInfoString) => {
    // sha is the first 40 characters of the string
    const sha = commitInfoString.slice(0, 40);
    // date is the rest of the string
    const date = commitInfoString.slice(40);
    return [sha, date];
};
/**
 * Checks out a Git repository at a specific commit SHA and returns an Observable that emits when the operation is complete.
 * If no error handler is provided, the function uses a default error handler that checks if the error message contains
 * the string 'fatal: ambiguous argument' and if so, it returns an Error object with the error message otherwise it returns null,
 * i.e. it ignores the error.
 * @param repoPath The path to the Git repository.
 * @param commitSha The commit SHA to check out the repository at.
 * @param stdErrorHandler An optional error handler function that takes the standard error output of the git command and returns an Error object or null.
 * @returns An Observable that emits when the operation is complete.
 * @throws An error if the checkout operation fails.
 */
function checkout$(repoPath, commitSha, executeCommandOptions) {
    const defaultStdErrorHandler = (stderr) => {
        console.log(`Message on stadard error:\n${stderr}`);
        let retVal = null;
        if (stderr.includes('fatal: ambiguous argument')) {
            const message = `Error: while checking out commit ${commitSha} in repo "${repoPath}"`;
            throw new repo_errors_1.GitError(message, repoPath, gitCommand);
        }
        return retVal;
    };
    const repoName = path_1.default.basename(repoPath);
    const gitCommand = `cd ${repoPath} && git checkout ${commitSha}`;
    executeCommandOptions = executeCommandOptions || {};
    executeCommandOptions.stdErrorHandler = executeCommandOptions.stdErrorHandler || defaultStdErrorHandler;
    return (0, execute_command_1.executeCommandObs)(`checkout ${repoName} at commit ${commitSha}`, gitCommand, executeCommandOptions);
}
exports.checkout$ = checkout$;
/**
 * Fetches all commits from a set of repositories within a specified date range.
 * @param repoPaths An array of paths to the repositories to fetch the commits from.
 * @param fromDate The start date of the date range. Defaults to the Unix epoch (1970-01-01T00:00:00Z).
 * @param toDate The end date of the date range. Defaults to the current date and time.
 * @param creationDateCsvFilePath The path to a CSV file containing the creation date of the repositories and the url to the remote origin
 * (we need to use the url of the remote origin since that is supposed to be the server on which we have created the repo and which therefore
 * contains the creation date - we probably have read the creation date from that server).
 * @returns An Observable that emits each commit in the repositories within the date range.
 */
function allCommits$(repoPaths, fromDate = new Date(0), toDate = new Date(Date.now()), creationDateCsvFilePath) {
    return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe((0, rxjs_1.concatMap)(({ repoPath, _fromDate }) => {
        return readCommitCompact$(repoPath, _fromDate, toDate, true);
    }));
}
exports.allCommits$ = allCommits$;
/**
 * Creates an Observable that emits objects containing a repository path and a start date.
 * The start date is either the creation date of the repository which is found in the creationDateCsvFile or a specified fallback date.
 *
 * @param repoPaths An array of paths to the repositories.
 * @param fromDate A fallback date to use if the creation date of a repository is not available.
 * @param creationDateCsvFilePath A path to a CSV file that maps repository URLs to creation dates. If the csv file is not provided or
 *          does not contain the url of a repository, the fallback date is used. The reason to use the creation data is to be able to
 *          fetch the commits from the beginning of the repository. If a repos has been forked, using the creation date
 *          allows to fetch the commits from the beginning of the fork and exclude the one of the original repository.
 * @returns An Observable that emits objects of the form { repoPath: string, _fromDate: Date }.
 *          Each emitted object represents a repository and the start date for fetching commits.
 */
function repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath) {
    const _repoCreationDateDict$ = creationDateCsvFilePath ?
        (0, repo_creation_date_1.repoCreationDateDict$)(creationDateCsvFilePath) : (0, rxjs_1.of)({});
    return _repoCreationDateDict$.pipe((0, rxjs_1.concatMap)((dict) => {
        return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.concatMap)((repoPath) => (0, repo_1.getRemoteOriginUrl$)(repoPath).pipe((0, rxjs_1.map)((remoteOriginUrl) => {
            return { repoPath, remoteOriginUrl };
        }))), (0, rxjs_1.map)(({ repoPath, remoteOriginUrl }) => {
            const repoCreationDate = dict[remoteOriginUrl];
            const _fromDate = repoCreationDate ? new Date(repoCreationDate) : fromDate;
            return { repoPath, _fromDate };
        }));
    }));
}
exports.repoPathAndFromDates$ = repoPathAndFromDates$;
/**
 * Counts the number of commits in a set of repositories within a specified date range.
 * @param repoPaths An array of paths to the repositories to count the commits from.
 * @param fromDate The start date of the date range. Defaults to the Unix epoch (1970-01-01T00:00:00Z).
 * @param toDate The end date of the date range. Defaults to the current date and time.
 * @returns An Observable that emits the total number of commits in the repositories within the date range.
 */
function countCommits$(repoPaths, fromDate = new Date(0), toDate = new Date(Date.now()), creationDateCsvFilePath) {
    return allCommits$(repoPaths, fromDate, toDate, creationDateCsvFilePath).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(commits => commits.length));
}
exports.countCommits$ = countCommits$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
exports.SEP = config_1.GIT_CONFIG.COMMIT_REC_SEP;
/**
 * Returns a new `CommitCompact` object with the given sha, author, date and comment starting from a string in the format
 * sha,date,author,comment received from the git log command.
 * @param commitDataFromGitlog A string in the format sha,date,author received from the git log command.
 * @returns A new `CommitCompact` object with the specified sha, author and date.
 */
function newCommitCompactFromGitlog(commitDataFromGitlog, repo) {
    const shaDateAuthorComment = commitDataFromGitlog.split(',');
    const sha = shaDateAuthorComment[0];
    const date = shaDateAuthorComment[1];
    const author = shaDateAuthorComment[2];
    // the comment may contain ',' characters, hence we can not simply take the 4th element of shaDateAuthorComment to fill the comment
    // we then have to calculat the position where the comment starts and take all the rest of the string starting from it
    // 3 needs to be added to the calculation of the length to cater for the 3 ',' characters that separate sha, date and author
    // replace the csv separator if present in the comment
    const lengthOfShaDateAuthor = sha.length + date.length + author.length + 3;
    const comment = commitDataFromGitlog.slice(lengthOfShaDateAuthor).replaceAll(config_2.CONFIG.CSV_SEP, config_2.CONFIG.CVS_SEP_SUBSTITUE);
    const commit = {
        sha,
        date: new Date(date),
        author: author,
        subject: comment,
        repo
    };
    return commit;
}
exports.newCommitCompactFromGitlog = newCommitCompactFromGitlog;
// exported for testing purposes only
function writeCommitWithFileNumstatCommand(params) {
    const args = readCommitWithFileNumstaCommandWithArgs(params, true);
    const cmdWithArgs = `git ${args.join(' ')}`;
    const out = buildGitOutfile(params);
    return [`${cmdWithArgs} > ${out}`, out];
}
exports.writeCommitWithFileNumstatCommand = writeCommitWithFileNumstatCommand;
/**
 * Returns an object containing the command and arguments to execute the git log command with the specified parameters.
 * The command returns the commit history enriched with the number of lines added and removed for each file in each commit.
 * @param params An object containing the parameters to pass to the git log command.
 * @param quotesForFilters A boolean indicating whether or not to use quotes for the filters.
 * @returns An array of arguments to execute the git log command with the specified parameters.
 */
function readCommitWithFileNumstaCommandWithArgs(params, quotesForFilters) {
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
        `--pretty=format:${exports.SEP}%h${exports.SEP}%ad${exports.SEP}%aN${exports.SEP}%cN${exports.SEP}%cd${exports.SEP}%f${exports.SEP}%p`,
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
exports.COMMITS_FILE_POSTFIX = '-commits.log';
exports.COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function buildGitOutfile(params) {
    let outDir = params.outDir ? params.outDir : './';
    outDir = path_1.default.resolve(outDir);
    const _postfix = params.reverse ? exports.COMMITS_FILE_REVERSE_POSTFIX : exports.COMMITS_FILE_POSTFIX;
    const _outfile = params.outFile ? params.outFile : '';
    const outFile = (0, file_name_utils_1.buildOutfileName)(_outfile, params.repoFolderPath, params.outFilePrefix, _postfix);
    const out = path_1.default.join(outDir, outFile);
    return out;
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
                    const isStartOfBuffer = line.length > 0 && line.slice(0, exports.SEP.length) === exports.SEP;
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
exports.commitLines = commitLines;
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
//# sourceMappingURL=commit.js.map