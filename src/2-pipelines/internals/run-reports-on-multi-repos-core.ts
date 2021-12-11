import path from 'path';
import { forkJoin } from 'rxjs';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { dirNamesListObs } from 'observable-fs';

import { ConfigReadCommits, ConfigReadCloc } from '../../1-A-read/read-params/read-params';
import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';

import { _runReportsFromStreams, _streams } from './run-reports-on-repo-core';

export function runAllReportsOnMultiRepos(
    reports: string[],
    repoFolderPaths: string[],
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    depthInFilesCoupling: number,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    const allReports = repoFolderPaths.map((repoFolderPath) => {
        // read the data from git and cloc tool
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, noRenames, reverse: true };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

        // generation of the source streams
        const { _commitStream, _filesStream, _clocSummaryStream } = _streams(
            commitLogPath,
            clocLogPath,
            clocSummaryPath,
            concurrentReadOfCommits,
            after,
            before,
        );

        // run the reports
        return _runReportsFromStreams(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFilePrefix,
            clocDefsPath,
            depthInFilesCoupling,
            _commitStream,
            _filesStream,
            _clocSummaryStream,
        ).pipe(
            map((reports) => {
                return { reports, repoFolderPath };
            }),
        );
    });

    return forkJoin(allReports);
}

export function gitRepos(startingFolder = './') {
    return dirNamesListObs(startingFolder).pipe(
        mergeMap((folders) => folders.map((folder) => path.join(startingFolder, folder))),
        mergeMap((folder) => {
            return dirNamesListObs(folder).pipe(map((folderDirs) => ({ folder, folderDirs })));
        }),
        filter(({ folderDirs }) => {
            return folderDirs.some((dir) => dir === '.git');
        }),
        map(({ folder }) => folder),
        toArray(),
    );
}
