import {
    buildClocOutfile,
    buildSummaryClocOutfile,
    createClocLog,
    createClocNewProcess,
    createSummaryClocLog,
    createSummaryClocNewProcess,
} from './cloc';
import { ConfigReadCommits, ConfigReadCloc } from './read-params/read-params';
import { buildGitOutfile, readCommits, readCommitsNewProces } from './read-git';
import { forkJoin, last, map } from 'rxjs';

// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
export function readAll(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    // execute the git log command to extract the commits
    const commitLogPath = readCommits(commitOptions);

    // execute the cloc commands
    const clocLogPath = createClocLog(readClocOptions, 'readAll-fileLinesOptions');
    const clocSummaryPath = createSummaryClocLog(readClocOptions);

    return [commitLogPath, clocLogPath, clocSummaryPath];
}

// performs all the read operations against a git repo in parallel distinct processes and return an Observable which emits
// the file paths of the logs created out of the read operations
export function readAllParallel(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    const outGitFile = buildGitOutfile(commitOptions);
    const outClocFile = buildClocOutfile(readClocOptions);
    const outClocSummaryFile = buildSummaryClocOutfile(readClocOptions);

    const { gitLogCommits, cloc, clocSummary } = _readStreamsDistinctProcesses(
        commitOptions,
        readClocOptions,
        outGitFile,
        outClocFile,
        outClocSummaryFile,
    );

    const _gitLogCommits = gitLogCommits.pipe(
        last(),
        map(() => outGitFile),
    );
    const _cloc = cloc.pipe(
        last(),
        map(() => outClocFile),
    );
    const _clocSummary = clocSummary.pipe(
        last(),
        map(() => outClocSummaryFile),
    );

    return forkJoin([_gitLogCommits, _cloc, _clocSummary]);
}

// builds the Observables that perform the read operations against a git repo in separate processes
export function readStreamsDistinctProcesses(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    const outGitFile = buildGitOutfile(commitOptions);
    const outClocFile = buildClocOutfile(readClocOptions);
    const outClocSummaryFile = buildSummaryClocOutfile(readClocOptions);

    return _readStreamsDistinctProcesses(commitOptions, readClocOptions, outGitFile, outClocFile, outClocSummaryFile);
}

function _readStreamsDistinctProcesses(
    commitOptions: ConfigReadCommits,
    readClocOptions: ConfigReadCloc,
    outGitFile: string,
    outClocFile: string,
    outClocSummaryFile: string,
) {
    // build the stream of commits
    const gitLogCommits = readCommitsNewProces(commitOptions, outGitFile);

    // build the streams of cloc info
    const cloc = createClocNewProcess(readClocOptions, outClocFile, 'create cloc log');
    const clocSummary = createSummaryClocNewProcess(readClocOptions, outClocSummaryFile, 'create cloc summary log');

    return { gitLogCommits, cloc, clocSummary };
}
