import path from 'path';

import {
    map, catchError, EMPTY, concatMap, from, filter, toArray, tap,
    share, of, ignoreElements, merge, Observable, Subscriber, pipe, forkJoin
} from 'rxjs';

import { appendFileObs } from 'observable-fs';

import { ExecuteCommandObsOptions, executeCommand, executeCommandNewProcessToLinesObs, executeCommandObs } from '../tools/execute-command/execute-command';

import { CommitCompact, CommitCompactWithUrlAndParentDate, newCommitWithFileNumstats } from './commit.model';
import { GIT_CONFIG } from './config';
import { GitLogCommitParams } from './git-params';
import { buildOutfileName } from './utils/file-name-utils';
import { CONFIG } from '../config';
import { deleteFile$ } from '../tools/observable-fs-extensions/delete-file-ignore-if-missing';
import { getGitlabCommitUrl } from './commit-url';
import { toYYYYMMDD } from '../tools/dates/date-functions';
import { isUnknownRevisionError } from './errors';
import { ERROR_UNKNOWN_REVISION_OR_PATH } from './errors';
import { GitError } from './git-errors';
import { repoPathAndFromDates$ } from './repo';

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
export function readCommitCompact$(
    repoPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    noMerges = true,
    _options?: ExecuteCommandObsOptions
) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    const _noMerges = noMerges ? '--no-merges' : '';
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an,%s" ${_noMerges}`;

    const options = [
        'log', '--pretty=format:%H,%ad,%an,%s',
        '--after=' + toYYYYMMDD(fromDate), '--before=' + toYYYYMMDD(toDate)
    ]
    if (noMerges) options.push('--no-merges')

    return executeCommandNewProcessToLinesObs(
        `Read commits`,
        'git',
        options,
        { cwd: repoPath },
        _options
    ).pipe(
        map((commits: string) => {
            return commits.split('\n')
        }),
        concatMap((commits: string[]) => {
            return from(commits);
        }),
        filter((commit: string) => {
            return commit.trim().length > 0;
        }),
        map((commit: string) => {
            return newCommitCompactFromGitlog(commit, repoPath);
        }),
        catchError((err: Error) => {
            console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`);
            return EMPTY;
        }),
    );
}

/**
 * Reads the commits in a Git repository for a certain period and returns an Observable of CommitCompactWithUrlAndParentDate objects.
 * The function fills the url for the commit and reads the parent commit of each commit and adds the parent date to the resulting object.
 * @param repoPath The path to the Git repository folder.
 * @param fromDate The start date of the time range. Defaults to the beginning of time.
 * @param toDate The end date of the time range. Defaults to the current date and time.
 * @param noMerges A boolean indicating whether to exclude merge commits. Defaults to true.
 * @returns An Observable of CommitCompactWithUrlAndParentDate objects.
 */
export function readCommitCompactWithUrlAndParentDate$(
    repoPath: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    noMerges = true,
    options?: ExecuteCommandObsOptions
) {
    return readCommitCompact$(repoPath, fromDate, toDate, noMerges, options).pipe(
        concatMap((commit) => {
            return getGitlabCommitUrl(repoPath, commit.sha, options).pipe(
                map((commitUrl) => {
                    return { commit, commitUrl };
                })
            )
        }),
        concatMap(({ commit, commitUrl }) => {
            const parentCommitSha = `${commit.sha}^1`;
            return readOneCommitCompact$(parentCommitSha, repoPath, options).pipe(
                catchError(err => {
                    // if the error is because the commit has no parent, then we set the parent date to the beginning of time
                    if (err === ERROR_UNKNOWN_REVISION_OR_PATH) {
                        const commitWithParentDate: CommitCompactWithUrlAndParentDate = {
                            ...commit,
                            parentDate: new Date(0),
                            commitUrl
                        };
                        return of(commitWithParentDate);
                    }
                    // in case of error we return an empty commit
                    console.log(err)
                    return of(newEmptyCommitCompact());
                }),
                map((parentCommit) => {
                    const commitWithParentDate: CommitCompactWithUrlAndParentDate = {
                        ...commit,
                        parentDate: parentCommit.date,
                        commitUrl
                    };
                    return commitWithParentDate;
                }),
            );
        }),
    );
}

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
export function readOneCommitCompact$(commitSha: string, repoPath: string, options?: ExecuteCommandObsOptions, verbose = true) {
    if (!commitSha.trim()) throw new Error(`Path is mandatory`);
    if (!repoPath.trim()) throw new Error(`Repo path is mandatory`);

    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return executeCommandObs('read one commit from log', cmd, options).pipe(
        toArray(),
        map((output) => {
            const commitCompact = newCommitCompactFromGitlog(output[0], repoPath);
            return commitCompact;
        }),
        catchError((error) => {
            if (isUnknownRevisionError(error)) {
                throw ERROR_UNKNOWN_REVISION_OR_PATH;
            }
            const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`;
            if (verbose) console.error(err);
            // in case of error we return an error
            throw new Error(err);
        }),
    );
}

/**
 * Reads the commits from a Git repository and writes the output to a file.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to control the read.
 * @returns The name of the file where the output is saved.
 */
export function writeCommitWithFileNumstat(params: GitLogCommitParams) {
    const [cmd, out] = writeCommitWithFileNumstatCommand(params);
    executeCommand('write commit log', cmd);
    console.log(
        `====>>>> Commits read from repo in folder ${params.repoFolderPath ?
            params.repoFolderPath :
            path.parse(process.cwd()).name
        }`,
    );
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}

/**
 * Reads the commits from a Git repository enriched with the number of lines added and removed for each file in 
 * each commit, and writes the output to a file if an outFile is provided.
 * The function returns an Observable that emits a stream of `CommitWithFileNumstat` objects 
 * representing the commits enriched with the number of lines added and removed for each file in each commit.
 * @param params An object containing the parameters to pass to the `readCommitWithFileNumstaFromLogCommandWithArgs` function.
 * @param outFile The path to the file where the output should be saved. If not provided, the output is not saved to a file.
 * @returns An Observable that emits a stream of `CommitWithFileNumstat` objects representing the commits enriched with the number of lines added and removed for each file in each commit.
 */
export function readCommitWithFileNumstat$(params: GitLogCommitParams, outFile = '') {
    const args = readCommitWithFileNumstaCommandWithArgs(params, false);
    // _readCommitsData$ is a stream of lines which represent the result of the git log command (i.e. data about the commits)
    // it is shared since it is the upstream for two streams which are merged at the end of the function
    // if we do not share it, then the git log command is executed twice
    const _readCommitsData$ = executeCommandNewProcessToLinesObs('readCommits', 'git', args).pipe(share());

    // _readCommitWithFileNumstat$ is a stream that derives from the upstream of lines notified by _readCommitsData$
    // and transform it into a stream of CommitWithFileNumstat objects
    const _readCommitWithFileNumstat$ = _readCommitsData$.pipe(
        filter((line) => line.length > 0),
        toCommitsWithFileNumstatdata(),
    )

    // _writeCommitLog$ is a stream which writes the commits to a file if an outFile is provided
    // if an outFile is provided, _writeCommitLog is a stream that writes the commits to the outFile silently
    // (silently means that it does not emit anything and completes when the writing is completed)
    // if no outFile, _writeCommitLog is the EMPTY stream, i.e. a stream that emits nothing and immediately completes
    const _writeCommitLog$ = outFile ? deleteFile$(outFile).pipe(
        concatMap(() => _readCommitsData$),
        // filter((line) => line.length > 0),
        concatMap((line) => {
            const _line = `${line}\n`;
            return appendFileObs(outFile, _line);
        }),
        ignoreElements(),
    ) :
        EMPTY;

    return merge(_readCommitWithFileNumstat$, _writeCommitLog$);
}

/**
 * Executes the `writeCommitLogCommand` function to write the commit log to a file and returns 
 * an Observable that emits the name of the file where the output is saved.
 * For each commit all the files changed in the commit are listed with the number of lines added and deleted.
 * @param params An object containing the parameters to pass to the `writeCommitLogCommand` function.
 * @returns An Observable that emits the name of the file where the output is saved.
 */
export function writeCommitWithFileNumstat$(params: GitLogCommitParams) {
    const [cmd, out] = writeCommitWithFileNumstatCommand(params);
    return executeCommandObs('write commit enriched log', cmd).pipe(
        tap({
            complete: () => {
                console.log(
                    `====>>>> Commits read from repo in folder ${params.repoFolderPath ? params.repoFolderPath : path.parse(process.cwd()).name
                    }`,
                );
                console.log(`====>>>> Output saved on file ${out}`);
            },
        }),
        map(() => out),
    );
}

/**
 * Returns a new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch, 
 * i.e. 1970-01-01.
 * @returns A new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch.
 */
export function newEmptyCommitCompact() {
    const commit: CommitCompact = {
        sha: '',
        date: new Date(0),
        author: '',
        subject: '',
        repo: ''
    };
    return commit;
}

/**
 * Fetches the commit SHA for a Git repository at a specific date and returns an Observable that emits the commit SHA.
 * If a commit is not found, it throws an error. This is the case when there is no commit at the date or before it.
 * @param repoPath The path to the Git repository.
 * @param date The date to fetch the commit SHA at.
 * @param branchName The branch to fetch the commit SHA from.
 * @returns An Observable that emits the commit SHA for the repository at the specified date.
 * @throws An error if the commit SHA could not be fetched.
 */
export function commitAtDateOrBefore$(repoPath: string, date: Date, branchName: string, options?: ExecuteCommandObsOptions) {
    // convert date to YYYY-MM-DD format
    const dateString = toYYYYMMDD(date);
    const gitCommand = `cd ${repoPath} && git log -n 1 --before="${dateString}-23:59:59" --format=%H%ci ${branchName}`
    return executeCommandObs(`read the commit sha at date ${dateString} for branch ${branchName}`, gitCommand, options).pipe(
        map(commitInfoString => {
            return commitInfoString.trim()
        }),
        tap((commitInfo) => {
            if (!commitInfo) {
                const errMsg = `Error: while reading the commit sha at date ${dateString} for branch ${branchName} in repo "${repoPath}"
                we expected to have a commit sha but we got an empty string.
                This probably means that there is no commit at date ${dateString} or before it for branch ${branchName} in repo "${repoPath}"
                Command erroring: "${gitCommand}"`;
                console.log(errMsg)
                // throw new GitError(errMsg, repoPath, gitCommand);
            }
        }),
        map(commitInfo => {
            // commitsInfo is a string containing the concatenation of all the commits in the format sha, date joined by a newline
            // need to take just the first line
            // remove the last newline character
            const firstLine = commitInfo.split('\n')[0]
            return splitShaDate(firstLine)
        })
    )
}

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
export function commitAtDateOrAfter$(repoPath: string, date: Date, branchName: string) {
    // convert date to YYYY-MM-DD format
    const dateString = toYYYYMMDD(date);
    // to find the first commit after a certain date we have to get the commits in reverse order and then take the first one
    // the option -n 1 does not work since git first applies the -n 1 option and then the --reverse option, which means that
    // it take the first commit in the normal order (which is the last one) and then reverses the order of the commits, with
    // the result that we get the last commit and not the first commit after the date
    // https://stackoverflow.com/a/5188990/5699993
    const gitCommand = `cd ${repoPath} && git log --reverse --after="${dateString}-00:00:00" --format=%H%ci ${branchName}`
    return executeCommandObs(`read the commit sha at date ${dateString} for branch ${branchName}`, gitCommand).pipe(
        map(commitSha => {
            return commitSha.trim()
        }),
        tap((commitsInfo) => {
            if (!commitsInfo) {
                const err = `Error: while reading the commit sha at date ${dateString} for branch ${branchName} in repo "${repoPath}"
                    we expected to have a commit sha but we got an empty string.
                    This probably means that there is no commit at date ${dateString} or after it for branch ${branchName} in repo "${repoPath}"
                    Command erroring: "${gitCommand}"`;
                console.error(err)
            }
        }),
        map(commitsInfo => {
            // commitsInfo is a string containing the concatenation of all the commits in the format sha, date joined by a newline
            // need to take just the first line
            const firstLine = commitsInfo.split('\n')[0]
            return splitShaDate(firstLine)
        })
    )
}

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
export function commitClosestToDate$(
    repoPath: string,
    date: Date,
    branchName: string,
    beforeWhenEqual = true
): Observable<[sha: string, date: string]> {
    const commitBeforeDate$ = commitAtDateOrBefore$(repoPath, date, branchName)
    const commitAfterDate$ = commitAtDateOrAfter$(repoPath, date, branchName)

    return forkJoin([commitBeforeDate$, commitAfterDate$]).pipe(
        map(([[beforeSha, beforeDate], [afterSha, afterDate]]) => {
            // calculate the distance between the date and the dates of the commits
            const beforeDateDistance = Math.abs(new Date(beforeDate).getTime() - date.getTime())
            const afterDateDistance = Math.abs(new Date(afterDate).getTime() - date.getTime())
            // return the commit sha of the commit closest to the date - if the distance is equal, return the date
            // before if beforeWhenEqual is true, otherwise return the date after
            if (beforeDateDistance === afterDateDistance) {
                return beforeWhenEqual ? [beforeSha, beforeDate] : [afterSha, afterDate]
            }
            return beforeDateDistance < afterDateDistance ? [beforeSha, beforeDate] : [afterSha, afterDate]
        }),
    )
}
const splitShaDate = (commitInfoString: string): [sha: string, date: string] => {
    if (!commitInfoString) {
        return ['', '']
    }
    // sha is the first 40 characters of the string
    const sha = commitInfoString.slice(0, 40)
    // date is the rest of the string
    const date = commitInfoString.slice(40)
    return [sha, date]
}

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
export function checkout$(repoPath: string, commitSha: string, executeCommandOptions?: ExecuteCommandObsOptions) {
    const defaultStdErrorHandler = (stderr: string) => {
        console.log(`Message on stadard error:\n${stderr}`)
        let retVal: Error | null = null
        if (stderr.includes('fatal: ambiguous argument')) {
            const message = `Error: while checking out commit ${commitSha} in repo "${repoPath}"`
            throw new GitError(message, repoPath, gitCommand);
        }
        return retVal
    }

    const repoName = path.basename(repoPath);
    const gitCommand = `cd ${repoPath} && git checkout ${commitSha}`;
    executeCommandOptions = executeCommandOptions || {} as ExecuteCommandObsOptions
    executeCommandOptions.stdErrorHandler = executeCommandOptions.stdErrorHandler || defaultStdErrorHandler
    return executeCommandObs(
        `checkout ${repoName} at commit ${commitSha}`,
        gitCommand,
        executeCommandOptions
    )
}

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
export function allCommits$(
    repoPaths: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    creationDateCsvFilePath?: string
) {
    return repoPathAndFromDates$(repoPaths, fromDate, creationDateCsvFilePath || null).pipe(
        concatMap(({ repoPath, _fromDate }) => {
            return readCommitCompact$(repoPath, _fromDate, toDate, true)
        }),
    )
}

/**
 * Counts the number of commits in a set of repositories within a specified date range.
 * @param repoPaths An array of paths to the repositories to count the commits from.
 * @param fromDate The start date of the date range. Defaults to the Unix epoch (1970-01-01T00:00:00Z).
 * @param toDate The end date of the date range. Defaults to the current date and time.
 * @returns An Observable that emits the total number of commits in the repositories within the date range.
 */
export function countCommits$(
    repoPaths: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    creationDateCsvFilePath?: string
) {
    return allCommits$(repoPaths, fromDate, toDate, creationDateCsvFilePath).pipe(
        toArray(),
        map(commits => commits.length),
    )
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export const SEP = GIT_CONFIG.COMMIT_REC_SEP;

/**
 * Returns a new `CommitCompact` object with the given sha, author, date and comment starting from a string in the format 
 * sha,date,author,comment received from the git log command.
 * @param commitDataFromGitlog A string in the format sha,date,author received from the git log command.
 * @returns A new `CommitCompact` object with the specified sha, author and date.
 */
export function newCommitCompactFromGitlog(commitDataFromGitlog: string, repo: string) {
    const shaDateAuthorComment = commitDataFromGitlog.split(',');
    const sha = shaDateAuthorComment[0]
    const date = shaDateAuthorComment[1]
    const author = shaDateAuthorComment[2]
    // the comment may contain ',' characters, hence we can not simply take the 4th element of shaDateAuthorComment to fill the comment
    // we then have to calculat the position where the comment starts and take all the rest of the string starting from it
    // 3 needs to be added to the calculation of the length to cater for the 3 ',' characters that separate sha, date and author
    // replace the csv separator if present in the comment
    const lengthOfShaDateAuthor = sha.length + date.length + author.length + 3
    const comment = commitDataFromGitlog.slice(lengthOfShaDateAuthor).replaceAll(CONFIG.CSV_SEP, CONFIG.CVS_SEP_SUBSTITUE)
    const commit: CommitCompact = {
        sha,
        date: new Date(date),
        author: author,
        subject: comment,
        repo
    };
    return commit;
}

// exported for testing purposes only
export function writeCommitWithFileNumstatCommand(params: GitLogCommitParams) {
    const args = readCommitWithFileNumstaCommandWithArgs(params, true);
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
function readCommitWithFileNumstaCommandWithArgs(params: GitLogCommitParams, quotesForFilters: boolean) {
    const repoFolder = params.repoFolderPath ? ['-C', `${params.repoFolderPath}`] : [];
    const after = params.after ? `--after=${params.after.trim()}` : '';
    const before = params.before ? `--before=${params.before.trim()} ` : '';
    let filters: any[] = [];
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

export const COMMITS_FILE_POSTFIX = '-commits.log';
export const COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function buildGitOutfile(params: GitLogCommitParams) {
    let outDir = params.outDir ? params.outDir : './';
    outDir = path.resolve(outDir);
    const _postfix = params.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const _outfile = params.outFile ? params.outFile : '';
    const outFile = buildOutfileName(_outfile, params.repoFolderPath, params.outFilePrefix, _postfix);
    const out = path.join(outDir, outFile);
    return out;
}

function toCommitsWithFileNumstatdata(logFilePath?: string) {
    return pipe(
        commitLines(logFilePath),
        map((lines) => {
            const commit = newCommitWithFileNumstats(lines);
            return commit;
        }),
    );
}

// Custom operator which splits the content of a git log into buffers of lines where each buffer contains all the lines
// relative to a single git commit
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
export function commitLines(logFilePath?: string) {
    return (source: Observable<string>) => {
        return new Observable((subscriber: Subscriber<string[]>) => {
            let buffer: string[];
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
