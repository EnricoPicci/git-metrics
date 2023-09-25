import {
    buildSummaryClocOutfile,
    createClocLog,
    streamClocNewProcess,
    createSummaryClocLog,
    streamSummaryClocNewProcess,
    createClocLogNewProcess,
    createSummaryClocNewProcess,
} from './cloc';
import { ConfigReadCommits, ConfigReadCloc } from './read-params/read-params';
import { buildGitOutfile, readCommits, readAndStreamCommitsNewProces, readCommitsNewProcess } from './read-git';
import { forkJoin } from 'rxjs';

// performs all the read operations against a git repo and return the file paths of the logs created out of the read operations
export function readAll(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    // execute the git log command to extract the commits
    const commitLogPath = readCommits(commitOptions);

    // execute the cloc commands
    const clocLogPath = createClocLog(readClocOptions, 'readAll-fileLinesOptions');
    const clocSummaryPath = createSummaryClocLog(readClocOptions);

    return [commitLogPath, clocLogPath, clocSummaryPath];
}

// read the git log and runs the cloc operations against a folder containing a repo. The read operations are performed in parallel distinct processes
// Return an Observable which emits the file paths of the logs created out of the read operations
export function readAllParallel(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    const gitLogCommits = readCommitsNewProcess(commitOptions);
    const cloc = createClocLogNewProcess(readClocOptions);
    const clocSummary = createSummaryClocNewProcess(readClocOptions);

    return forkJoin([gitLogCommits, cloc, clocSummary]);
}

// builds the Observables that perform the read operations against a git repo in separate processes
export function readStreamsDistinctProcesses(commitOptions: ConfigReadCommits, readClocOptions: ConfigReadCloc) {
    const outGitFile = buildGitOutfile(commitOptions);
    const outClocSummaryFile = buildSummaryClocOutfile(readClocOptions);

    return _streamsDistinctProcesses(
        commitOptions,
        readClocOptions,
        outGitFile,
        outClocSummaryFile,
        false,
    );
}

function _streamsDistinctProcesses(
    commitOptions: ConfigReadCommits,
    readClocOptions: ConfigReadCloc,
    outGitFile: string,
    outClocSummaryFile: string,
    writeFileOnly: boolean,
) {
    // build the stream of commits
    const gitLogCommits = readAndStreamCommitsNewProces(commitOptions, outGitFile, writeFileOnly);

    // build the streams of cloc info
    const cloc = streamClocNewProcess(readClocOptions, 'create cloc log');
    const clocSummary = streamSummaryClocNewProcess(
        readClocOptions,
        outClocSummaryFile,
        'create cloc summary log',
        writeFileOnly,
    );

    return { gitLogCommits, cloc, clocSummary };
}
