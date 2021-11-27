import { concatMap, map, merge, Observable } from 'rxjs';

import { ConfigReadCommits, ConfigReadCloc } from '../../git-read-enrich/config/config';
import { readAll } from '../../git-read-enrich/read-all';
import { createDirIfNotExisting } from '../../git-read-enrich/create-outdir';

import { gitRepos } from './run-reports-on-multi-repos-core';
import { clocSummaryStream, createSummaryClocLog } from '../../git-read-enrich/cloc';
import { FileGitCommitEnriched, GitCommitEnriched } from '../../git-enriched-types/git-types';
import path from 'path';
import { runReportsFromStreams, _streams } from './run-reports-on-repo-core';

export function runAllReportsOnMergedRepos(
    reports: string[],
    repoContainerFolderPath: string,
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    depthInFilesCoupling: number,
    parallelReadOfCommits: boolean,
    noRenames: boolean,
) {
    // create the output directory if not existing
    const _outDir = path.resolve(outDir ? outDir : '');
    createDirIfNotExisting(_outDir);

    const repoFolderPaths = gitRepos(repoContainerFolderPath);

    return repoFolderPaths.pipe(
        map((_repoFolderPaths) => {
            const allCommitStreams: Observable<GitCommitEnriched>[] = [];
            const allFileStreams: Observable<FileGitCommitEnriched>[] = [];
            _repoFolderPaths.forEach((repoFolderPath) => {
                // read the data from git and cloc tool
                const commitOptions: ConfigReadCommits = { repoFolderPath, outDir: _outDir, filter, noRenames };
                const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir: _outDir };
                const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

                // generation of the source streams
                const { _commitStream, _filesStream } = _streams(
                    commitLogPath,
                    clocLogPath,
                    clocSummaryPath,
                    parallelReadOfCommits,
                    after,
                    before,
                );
                allCommitStreams.push(
                    _commitStream.pipe(
                        map((commit) => {
                            const _commit = { ...commit };
                            _commit.files.forEach((f) => {
                                f.path = `${repoFolderPath}--${f.path}`;
                            });
                            return _commit;
                        }),
                    ),
                );
                allFileStreams.push(_filesStream);
            });

            const clocSummaryPath = createSummaryClocLog({ repoFolderPath: repoContainerFolderPath, outDir: _outDir });
            const _clocSummaryStream = clocSummaryStream(clocSummaryPath);
            return {
                allCommitStreamsMerged: merge(...allCommitStreams),
                allFileStreamsMerged: merge(...allFileStreams),
                _clocSummaryStream,
            };
        }),
        concatMap(({ allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream }) => {
            // run the reports
            return runReportsFromStreams(
                reports,
                repoContainerFolderPath,
                filter,
                after,
                before,
                _outDir,
                outFilePrefix,
                clocDefsPath,
                depthInFilesCoupling,
                allCommitStreamsMerged,
                allFileStreamsMerged,
                _clocSummaryStream,
            );
        }),
    );
}
