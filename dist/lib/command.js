#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_count_repos_commits_1 = require("../apps/cloc-on-repos/read-repos-commits/launch-count-repos-commits");
const launch_cloc_repos_1 = require("../apps/cloc-on-repos//cloc-repos/launch-cloc-repos");
const launch_cloc_diff_repos_1 = require("../apps/cloc-on-repos//cloc-diff-repos/launch-cloc-diff-repos");
const run_reports_on_repo_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-repo");
const run_reports_on_merged_repos_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos");
const run_branches_report_1 = require("../apps/reports-on-repo/2-pipelines/run-branches-report");
const command = process.argv[2];
switch (command) {
    case 'read-repos-commits':
        (0, launch_count_repos_commits_1.launchCountReposCommits)();
        break;
    case 'cloc-repos':
        (0, launch_cloc_repos_1.launchClocRepos)();
        break;
    case 'cloc-monthly-diff-repos':
        (0, launch_cloc_diff_repos_1.launchMonthlyClocDiffRepos)();
        break;
    case 'code-turnover':
        (0, launch_cloc_diff_repos_1.launchCalculateCodeTurnover)();
        break;
    case 'cloc-diff-repos':
        (0, launch_cloc_diff_repos_1.launchCalculateCodeTurnover)();
        break;
    case 'run-reports-on-repo':
        (0, run_reports_on_repo_1.launchReportsParallelReads)();
        break;
    case 'run-reports-on-repos-in-folder':
        (0, run_reports_on_merged_repos_1.launchAllReportsOnMergedRepos)();
        break;
    case 'run-branches-report-on-repo':
        (0, run_branches_report_1.launchBranchesReport)();
        break;
    default:
        console.log(`Command ${command} not found`);
        console.log(`Commands allowed:  
        cloc-repos, 
        code-turnover, 
        cloc-monthly-diff-repos,
        run-reports-on-repo,
        run-reports-on-repos-in-folder,
        run-branches-report-on-repo`);
        break;
}
//# sourceMappingURL=command.js.map