#!/usr/bin/env node

import { launchCountReposCommits } from '../apps/read-repos-commits/launch-count-repos-commits';
import { launchCalculateCodeTurnover, launchMonthlyClocDiffRepos } from '../apps/code-turnover/launch-code-turnover';
import { launchReportsParallelReads } from '../apps/reports-on-repo/2-pipelines/run-reports-on-repo';
import { launchAllReportsOnMergedRepos } from '../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos';
import { launchBranchesReport } from '../apps/reports-on-repo/2-pipelines/run-branches-report';
import { launchRunReportsAndCodeTurnover } from '../apps/code-turnover-and-reports/launch-code-turnover-and-reports';
import { launchClocByfileForRepos } from '../apps/cloc-byfile-for-repos/launch-cloc-byfile-for-repos';
import { launchClocDiffByfileWithCommit } from '../apps/cloc-diff-byfile-with-commit/launch-cloc-diff-byfile-with-commit';
import { launchClocDiffByfileWithCommitForRepos } from '../apps/cloc-diff-byfile-with-commit-for-repos/launch-cloc-diff-byfile-with-commit-for-repos';

const command = process.argv[2];

const commandsAvailable: { [command: string]: () => void } = {
    'read-repos-commits': launchCountReposCommits,
    'cloc-monthly-diff-repos': launchMonthlyClocDiffRepos,
    'code-turnover': launchCalculateCodeTurnover,
    'code-turnover-and-reports': launchRunReportsAndCodeTurnover,
    'run-reports-on-repo': launchReportsParallelReads,
    'run-reports-on-repos-in-folder': launchAllReportsOnMergedRepos,
    'run-branches-report-on-repo': launchBranchesReport,
    'cloc-byfile-for-repos': launchClocByfileForRepos,
    'cloc-diff-byfile-with-commit': launchClocDiffByfileWithCommit,
    'cloc-diff-byfile-with-commit-for-repos': launchClocDiffByfileWithCommitForRepos
}

const functionForCommand = commandsAvailable[command];

if (functionForCommand) {
    functionForCommand();
} else {
    console.log(`Command ${command} not found`);
    console.log(`Commands allowed:`)

    Object.keys(commandsAvailable).forEach(command => {
        console.log(command);
    })
}


