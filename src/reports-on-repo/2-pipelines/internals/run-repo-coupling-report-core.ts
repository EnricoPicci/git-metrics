import { ConfigReadCloc, ConfigReadCommits } from '../../1-A-read/read-params/read-params';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';
import { readAll } from '../../1-A-read/read-all';

import { filesStream } from '../../1-B-git-enriched-streams/files';

import { repoCouplingReport } from '../../1-D-reports/repo-coupling-report';
import { fileTuplesDict } from '../../1-C-aggregate-in-memory/repo-coupling-aggregate';

export function runRepoCouplingReport(
    repoFolderPaths: string[],
    timeWindowLengthInDays: number,
    csvFilePath: string,
    filter?: string[],
    after?: string,
    outDir?: string,
    outFile?: string,
    outClocFile?: string,
    clocDefsPath?: string,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir!);

    const fileStreams = repoFolderPaths.map((repoFolderPath) => {
        const commitOptions: ConfigReadCommits = { filter, outDir: outDir!, repoFolderPath, outFile, after, reverse: true };
        const readClocOptions: ConfigReadCloc = { outDir: outDir!, repoFolderPath, outClocFile, clocDefsPath };
        const [commitLogPath, clocLogPath] = readAll(commitOptions, readClocOptions);
        return filesStream(commitLogPath, clocLogPath);
    });

    const fileTupleDict = fileTuplesDict(fileStreams, timeWindowLengthInDays);

    return repoCouplingReport(fileTupleDict, csvFilePath);
}
