#!/usr/bin/env node

import { launchCountReposCommits } from '../apps/read-repos-commits/launch-count-repos-commits';
import { launchMonthlyClocDiffRepos } from '../apps/monthly-cloc-diff-for-repos/launch-monthly-cloc-diff-for-repos';

import { launchCodeTurnoverForRepos } from '../apps/code-turnover-for-repos/launch-code-turnover-for-repos';
import { launchClocByfileForRepos } from '../apps/cloc-byfile-for-repos/launch-cloc-byfile-for-repos';

import { launchReportsParallelReads } from '../apps/reports-on-repo/2-pipelines/run-reports-on-repo';
import { launchAllReportsOnMergedRepos } from '../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos';
import { launchBranchesReport } from '../apps/reports-on-repo/2-pipelines/run-branches-report';

const command = process.argv[2];

const commandsAvailable: { [command: string]: () => void } = {
    'read-repos-commits': launchCountReposCommits,
    'cloc-monthly-diff-repos': launchMonthlyClocDiffRepos,
    'code-turnover': launchCodeTurnoverForRepos,
    'run-reports-on-repo': launchReportsParallelReads,
    'run-reports-on-repos-in-folder': launchAllReportsOnMergedRepos,
    'run-branches-report-on-repo': launchBranchesReport,
    'cloc-byfile-for-repos': launchClocByfileForRepos,
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


