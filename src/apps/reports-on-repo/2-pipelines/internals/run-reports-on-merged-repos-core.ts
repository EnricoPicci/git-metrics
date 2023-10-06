import path from 'path';
import { concatMap, map, merge, Observable } from 'rxjs';

import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';

import { FileGitCommitEnriched } from '../../1-B-git-enriched-types/git-types';
import { CommitWithFileNumstats } from "../../../../git-functions/commit.model";

import { gitRepos } from './run-reports-on-multi-repos-core';
import { _runReportsFromStreams, _streams } from './run-reports-on-repo-core';
import { GitLogCommitParams } from '../../../../git-functions/git-params';
import { ClocParams } from '../../../../cloc-functions/cloc-params';
import { clocSummaryCsvRaw$, writeClocSummary } from '../../../../cloc-functions/cloc.functions';

export function runAllReportsOnMergedRepos(
    reports: string[],
    repoContainerFolderPath: string,
    filter: string[],
    after: Date,
    before: Date,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
) {
    // create the output directory if not existing
    const _outDir = path.resolve(outDir ? outDir : '');
    createDirIfNotExisting(_outDir);

    const repoFolderPaths = gitRepos(repoContainerFolderPath);

    return repoFolderPaths.pipe(
        map((_repoFolderPaths) => {
            const allCommitStreams: Observable<CommitWithFileNumstats>[] = [];
            const allFileStreams: Observable<FileGitCommitEnriched>[] = [];
            _repoFolderPaths.forEach((repoFolderPath) => {
                // read the data from git and cloc tool
                const commitOptions: GitLogCommitParams = {
                    repoFolderPath,
                    outDir: _outDir,
                    filter,
                    noRenames,
                    reverse: true,
                };
                const clocParams: ClocParams = { folderPath: repoFolderPath, outDir: _outDir };
                const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, clocParams);

                // generation of the source streams
                const { _commitStream, _filesStream } = _streams(
                    commitLogPath,
                    clocLogPath,
                    clocSummaryPath,
                    concurrentReadOfCommits,
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

            const clocSummaryPath = writeClocSummary({ folderPath: repoContainerFolderPath, outDir: _outDir });
            const _clocSummaryStream = clocSummaryCsvRaw$(clocSummaryPath);
            return {
                allCommitStreamsMerged: merge(...allCommitStreams),
                allFileStreamsMerged: merge(...allFileStreams),
                _clocSummaryStream,
            };
        }),
        concatMap(({ allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream }) => {
            // run the reports
            return _runReportsFromStreams(
                reports,
                repoContainerFolderPath,
                filter,
                after,
                before,
                _outDir,
                outFilePrefix,
                clocDefsPath,
                ignoreClocZero,
                depthInFilesCoupling,
                allCommitStreamsMerged,
                allFileStreamsMerged,
                _clocSummaryStream,
            );
        }),
    );
}
