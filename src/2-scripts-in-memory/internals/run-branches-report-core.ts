import path from 'path';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigReadCommits, ConfigReadCloc } from '../../1-A-read/config/config';
import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';
import { clocSummaryStream } from '../../1-A-read/cloc';

import { enrichedCommitsStream } from '../../1-B-git-enriched-streams/commits';
import { GitCommitEnriched } from '../../1-B-git-enriched-types/git-types';
import { commitWithBranchTips } from '../../1-B-git-enriched-streams/commits-and-branch-tips';

import { projectInfo } from '../../1-C-aggregate-in-memory/project-info-aggregate';
import { commitDaylySummary } from '../../1-C-aggregate-in-memory/commit-branch-tips-aggregate';

import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { addConsiderationsForBranchesReport, branchesReportCore } from '../../1-D-reports/branches-report';

export function runBranchesReport(
    repoFolderPath: string,
    after: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    noRenames: boolean,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // read the data from git and cloc tool
    const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, noRenames, reverse: true };
    const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
    const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

    // generation of the source streams
    const _commitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
    const _clocSummaryStream = clocSummaryStream(clocSummaryPath);

    // run the reports
    return runBranchesReportFromStreams(
        repoFolderPath,
        after,
        outDir,
        outFilePrefix,
        clocDefsPath,
        _commitStream,
        _clocSummaryStream,
    );
}

export function runBranchesReportFromStreams(
    repoFolderPath: string,
    after: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    _commitStream: Observable<GitCommitEnriched>,
    _clocSummaryStream: Observable<string[]>,
) {
    const params = {
        repoFolderPath,
        outDir,
        clocDefsPath,
        after: new Date(after),
    };
    const repoName = path.parse(repoFolderPath).name;
    const _outFileBranches = outFilePrefix ? `${outFilePrefix}-branches.csv` : `${repoName}-branches.csv`;
    const csvFile = path.join(outDir, _outFileBranches);
    const _outFileWeeklyBranches = outFilePrefix ? `${outFilePrefix}-branches.csv` : `${repoName}-branches.csv`;
    const weeklyCsvFile = path.join(outDir, _outFileWeeklyBranches);

    const _commitsWithBranchTips = _commitStream.pipe(commitWithBranchTips());

    // aggregation
    const _daylySummaryDictionary = commitDaylySummary(_commitsWithBranchTips);

    return forkJoin([
        projectInfo(_commitStream, _clocSummaryStream),
        branchesReportCore(_daylySummaryDictionary, params, csvFile, weeklyCsvFile),
    ]).pipe(
        map(([_projectInfo, _branchesReport]) => {
            addProjectInfo(_branchesReport, _projectInfo, csvFile);
            return addConsiderationsForBranchesReport(_branchesReport);
        }),
    );
}
