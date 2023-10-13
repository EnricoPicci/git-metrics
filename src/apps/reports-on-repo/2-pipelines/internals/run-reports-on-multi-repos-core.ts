import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../../../tools/fs-utils/fs-utils';

import { _runReportsFromStreams, _streams } from './run-reports-on-repo-core';
import { GitLogCommitParams } from '../../../../git-functions/git-params';
import { ClocParams } from '../../../../cloc-functions/cloc-params';

export function runAllReportsOnMultiRepos(
    reports: string[],
    repoFolderPaths: string[],
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
    createDirIfNotExisting(outDir);

    const allReports = repoFolderPaths.map((repoFolderPath) => {
        // read the data from git and cloc tool
        const commitOptions: GitLogCommitParams = { repoFolderPath, outDir, filter, noRenames, reverse: true };
        const clocParams: ClocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, clocParams);

        // generation of the source streams
        const { _commitStream, _filesStream, _clocSummaryStream } = _streams(
            commitLogPath,
            clocLogPath,
            clocSummaryPath,
            concurrentReadOfCommits,
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
            ignoreClocZero,
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
