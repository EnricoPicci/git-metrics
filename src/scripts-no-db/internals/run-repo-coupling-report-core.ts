import { filesStream } from '../../git-read-enrich/files';
import { ConfigReadCloc, ConfigReadCommits } from '../../git-read-enrich/config/config';
import { createDirIfNotExisting } from '../../git-read-enrich/create-outdir';
import { readAll } from '../../git-read-enrich/read-all';
import { repoCouplingReport } from '../../reports/repo-coupling-report';

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
    createDirIfNotExisting(outDir);

    const fileStreams = repoFolderPaths.map((repoFolderPath) => {
        const commitOptions: ConfigReadCommits = { filter, outDir, repoFolderPath, outFile, after, reverse: true };
        const readClocOptions: ConfigReadCloc = { outDir, repoFolderPath, outClocFile, clocDefsPath };
        const [commitLogPath, clocLogPath] = readAll(commitOptions, readClocOptions);
        return filesStream(commitLogPath, clocLogPath);
    });

    return repoCouplingReport(fileStreams, timeWindowLengthInDays, csvFilePath);
}
