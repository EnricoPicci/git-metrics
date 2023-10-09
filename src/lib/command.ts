#!/usr/bin/env node

import { launchCountReposCommits } from '../apps/cloc-on-repos/read-repos-commits/launch-count-repos-commits';
import { launchClocRepos } from '../apps/cloc-on-repos//cloc-repos/launch-cloc-repos';
import { launchCalculateCodeTurnover, launchMonthlyClocDiffRepos } from '../apps/code-turnover/launch-code-turnover';
import { launchReportsParallelReads } from '../apps/reports-on-repo/2-pipelines/run-reports-on-repo';
import { launchAllReportsOnMergedRepos } from '../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos';
import { launchBranchesReport } from '../apps/reports-on-repo/2-pipelines/run-branches-report';
import { launchRunReportsAndCodeTurnover } from '../apps/code-turnover-and-reports/launch-code-turnover-and-reports';

const command = process.argv[2];

switch (command) {
    case 'read-repos-commits':
        launchCountReposCommits();
        break;
    case 'cloc-repos':
        launchClocRepos();
        break;
    case 'cloc-monthly-diff-repos':
        launchMonthlyClocDiffRepos();
        break;
    case 'code-turnover':
        launchCalculateCodeTurnover();
        break;
    case 'cloc-diff-repos':
        launchCalculateCodeTurnover();
        break;
    case 'code-turnover-and-reports':
        launchRunReportsAndCodeTurnover();
        break;
    case 'run-reports-on-repo':
        launchReportsParallelReads();
        break;
    case 'run-reports-on-repos-in-folder':
        launchAllReportsOnMergedRepos();
        break;
    case 'run-branches-report-on-repo':
        launchBranchesReport();
        break;
    default:
        console.log(`Command ${command} not found`);
        console.log(`Commands allowed:  
        cloc-repos, 
        code-turnover, 
        cloc-monthly-diff-repos,
        run-reports-on-repo,
        run-reports-on-repos-in-folder,
        run-branches-report-on-repo,
        code-turnover-and-reports`);
        break;
}
