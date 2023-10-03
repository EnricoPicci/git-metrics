import path from 'path';

import { forkJoin } from 'rxjs';

import {
    COMMITS_FILE_POSTFIX, COMMITS_FILE_REVERSE_POSTFIX, readCommitWithFileNumstat$,
    writeCommitWithFileNumstat, writeCommitWithFileNumstat$
} from '../../../git-functions/commit.functions';
import { buildOutfileName, clocByfile$, writeClocByfile, writeClocSummary } from '../../../cloc-functions/cloc.functions';
import { GitLogCommitParams } from '../../../git-functions/git-params';

import {
    buildSummaryClocOutfile,
    createClocLog,
    createSummaryClocLog,
    clocSummaryAsStreamOfStrings$,
    createClocLogNewProcess,
    createSummaryClocNewProcess,
    paramsFromConfig,
} from './cloc';
import { ConfigReadCloc } from './read-params/read-params';
import { ClocParams } from '../../../cloc-functions/cloc-params';

// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
export function readAll(commitOptions: GitLogCommitParams, clocParams: ClocParams) {
    // execute the git log command to extract the commits
    const commitLogPath = writeCommitWithFileNumstat(commitOptions);

    // execute the cloc commands
    const clocLogPath = writeClocByfile(clocParams, 'readAll-fileLinesOptions');
    const clocSummaryPath = writeClocSummary(clocParams);

    return [commitLogPath, clocLogPath, clocSummaryPath];
}

// read the git log and runs the cloc operations against a folder containing a repo. The read operations are performed in parallel distinct processes
// Return an Observable which emits the file paths of the logs created out of the read operations
export function readAllParallel(commitOptions: GitLogCommitParams, readClocOptions: ConfigReadCloc) {
    const gitLogCommits = writeCommitWithFileNumstat$(commitOptions);
    const cloc = createClocLogNewProcess(readClocOptions);
    const clocSummary = createSummaryClocNewProcess(readClocOptions);

    return forkJoin([gitLogCommits, cloc, clocSummary]);
}

// builds the Observables that perform the read operations against a git repo in separate processes
export function readStreamsDistinctProcesses(commitOptions: GitLogCommitParams, readClocOptions: ConfigReadCloc) {
    const outGitFile = buildGitOutfile(commitOptions);
    const outClocSummaryFile = buildSummaryClocOutfile(readClocOptions);

    return _streamsDistinctProcesses(
        commitOptions,
        readClocOptions,
        outGitFile,
        outClocSummaryFile,
    );
}

function _streamsDistinctProcesses(
    commitOptions: GitLogCommitParams,
    readClocOptions: ConfigReadCloc,
    outGitFile: string,
    outClocSummaryFile: string,
) {
    // build the stream of commits
    const gitLogCommits = readCommitWithFileNumstat$(commitOptions, outGitFile);

    // build the streams of cloc info
    const params = paramsFromConfig(readClocOptions);
    const cloc = clocByfile$(params, 'create cloc log', true)
    const clocSummary = clocSummaryAsStreamOfStrings$(
        readClocOptions,
        outClocSummaryFile,
        'git',
    );

    return { gitLogCommits, cloc, clocSummary };
}

function buildGitOutfile(config: GitLogCommitParams) {
    let outDir = config.outDir ? config.outDir : './';
    outDir = path.resolve(outDir);
    const _postfix = config.reverse ? COMMITS_FILE_REVERSE_POSTFIX : COMMITS_FILE_POSTFIX;
    const outFile = buildOutfileName(config.outFile!, config.repoFolderPath, config.outFilePrefix, _postfix);
    const out = path.join(outDir, outFile);
    return out;
}
