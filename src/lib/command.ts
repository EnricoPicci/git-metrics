#!/usr/bin/env node

import { launchCountReposCommits } from '../apps/read-repos-commits/launch-count-repos-commits';
import { launchMonthlyClocDiffRepos } from '../apps/monthly-cloc-diff/launch-monthly-cloc-diff';

import { launchCodeTurnoverForRepos } from '../apps/code-turnover/launch-code-turnover';
import { launchClocByfileMultiRepos } from '../apps/cloc-byfile-multi-repos/launch-cloc-byfile-multi-repos';

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
    'cloc-byfile-multi-repos': launchClocByfileMultiRepos,
}

const functionForCommand = commandsAvailable[command];

if (functionForCommand) {
    functionForCommand();
} else {
    if (command) {
        console.log(`Command ${command} not found`);
    }

    console.log(`Commands allowed:`)

    Object.keys(commandsAvailable).forEach(command => {
        console.log('- ' + command);
    })
}


