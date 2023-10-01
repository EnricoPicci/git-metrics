import path from 'path';

import { map, catchError, EMPTY, concatMap, from, filter, toArray } from 'rxjs';

import { executeCommand, executeCommandNewProcessToLinesObs, executeCommandObs } from '../tools/execute-command/execute-command';
import { CommitCompact } from './commit.model';
import { GIT_CONFIG } from './config';
import { ReadGitCommitParams } from './git-params';

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
export function readCommitFromLog$(repoPath: string, fromDate = new Date(0), toDate = new Date(Date.now())) {
    if (!repoPath) throw new Error(`Path is mandatory`);

    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an" --no-merges`;

    return executeCommandNewProcessToLinesObs(
        `Read commits`,
        'git',
        ['log', '--pretty=format:%H,%ad,%an', '--no-merges'],
        { cwd: repoPath },
    ).pipe(
        map((commits: string) => commits.split('\n')),
        concatMap((commits: string[]) => {
            return from(commits);
        }),
        map((commit: string) => {
            return newCommitCompactFromGitlog(commit);
        }),
        filter((commit: CommitCompact) => {
            return commit.date >= fromDate && commit.date <= toDate;
        }),
        catchError((err: Error) => {
            console.error(`Error: "fetchCommits" while executing command "${command}" - error ${err.stack}`);
            return EMPTY;
        }),
    );
}

/**
 * Reads the commits from a Git repository and writes the output to a file.
 * @param params An object containing the parameters to control the read.
 * @returns The name of the file where the output is saved.
 */
export function writeCommitLog(params: ReadGitCommitParams) {
    const [cmd, out] = writeCommitLogCommand(params);
    executeCommand('readCommits', cmd);
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
export function readOneCommitFromLog$(commitSha: string, repoPath: string, verbose = true) {
    if (!commitSha.trim()) throw new Error(`Path is mandatory`);
    if (!repoPath.trim()) throw new Error(`Repo path is mandatory`);

    // the -n 1 option limits the number of commits to 1
    const cmd = `cd ${repoPath} && git log --pretty=%H,%ad,%an ${commitSha} -n 1`;
    return executeCommandObs('run git-log to find parent', cmd).pipe(
        toArray(),
        map((output) => {
            const commitCompact = newCommitCompactFromGitlog(output[0]);
            return commitCompact;
        }),
        catchError((error) => {
            const err = `Error in fetchOneCommit for repo "${repoPath} and commit ${commitSha}"\nError: ${error}
Command: ${cmd}`;
            if (verbose) console.error(err);
            // in case of error we return an error
            throw new Error(err);
        }),
    );
}

/**
 * Returns a new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch, 
 * i.e. 1970-01-01.
 * @returns A new `CommitCompact` object with no sha, author, and the date set to the beginning of the Unix epoch.
 */
export function newEmptyCommit() {
    const commit: CommitCompact = {
        sha: '',
        date: new Date(0),
        author: '',
    };
    return commit;
}

/**
 * Returns a new `CommitCompact` object with the given sha, author and date starting from a string in the format 
 * sha,date,author received from the git log command.
 * @param commitDataFromGitlog A string in the format sha,date,author received from the git log command.
 * @returns A new `CommitCompact` object with the specified sha, author and date.
 */
export function newCommitCompactFromGitlog(commitDataFromGitlog: string) {
    const shaDateAuthor = commitDataFromGitlog.split(',');
    const commit: CommitCompact = {
        sha: shaDateAuthor[0],
        date: new Date(shaDateAuthor[1]),
        author: shaDateAuthor[2],
    };
    return commit;
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
const SEP = GIT_CONFIG.COMMIT_REC_SEP;

function writeCommitLogCommand(params: ReadGitCommitParams) {
    const { cmd, args } = writeCommitLogCommandWithArgs(params, true);
    const cmdWithArgs = `${cmd} ${args.join(' ')}`;
    const out = buildGitOutfile(params);
    return [`${cmdWithArgs} > ${out}`, out];
}
function writeCommitLogCommandWithArgs(params: ReadGitCommitParams, quotesForFilters: boolean) {
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
    return {
        cmd: `git`,
        args,
    };
}
const DEFAULT_OUT_DIR = './';
export const COMMITS_FILE_POSTFIX = '-commits.log';
export const COMMITS_FILE_REVERSE_POSTFIX = '-commits-reverse.log';
function buildGitOutfile(params: ReadGitCommitParams) {
    let outDir = params.outDir ? params.outDir : DEFAULT_OUT_DIR;
    outDir = path.resolve(outDir);
    const _postfix = params.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const outFile = buildOutfileName(params.outFile, params.repoFolderPath, params.outFilePrefix, _postfix);
    const out = path.join(outDir, outFile);
    return out;
}

function buildOutfileName(outFile = '', repoFolder = '', prefix = '', postfix = '') {
    const repoFolderName = path.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path.parse(process.cwd()).name : repoFolderName;
    return outFile ? outFile : `${prefix}${(_repoFolderName)}${postfix}`;
}