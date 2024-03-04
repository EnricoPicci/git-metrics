#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_count_repos_commits_1 = require("../apps/read-repos-commits/launch-count-repos-commits");
const launch_monthly_cloc_diff_1 = require("../apps/monthly-cloc-diff/launch-monthly-cloc-diff");
const launch_code_turnover_1 = require("../apps/code-turnover/launch-code-turnover");
const launch_cloc_byfile_multi_repos_1 = require("../apps/cloc-byfile-multi-repos/launch-cloc-byfile-multi-repos");
const run_reports_on_repo_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-repo");
const run_reports_on_merged_repos_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos");
const run_branches_report_1 = require("../apps/reports-on-repo/2-pipelines/run-branches-report");
const launch_fetch_repos_1 = require("../apps/repos-utils/fetch-repos/launch-fetch-repos");
const launch_pull_repos_1 = require("../apps/repos-utils/pull-repos/launch-pull-repos");
const cloc_diff_between_dates_1 = require("../apps/cloc-diff-between-dates/cloc-diff-between-dates");
const command = process.argv[2];
const commandsAvailable = {
    'read-repos-commits': launch_count_repos_commits_1.launchCountReposCommits,
    'cloc-monthly-diff-repos': launch_monthly_cloc_diff_1.launchMonthlyClocDiffRepos,
    'code-turnover': launch_code_turnover_1.launchCodeTurnoverForRepos,
    'run-reports-on-repo': run_reports_on_repo_1.launchReportsParallelReads,
    'run-reports-on-repos-in-folder': run_reports_on_merged_repos_1.launchAllReportsOnMergedRepos,
    'run-branches-report-on-repo': run_branches_report_1.launchBranchesReport,
    'cloc-byfile-multi-repos': launch_cloc_byfile_multi_repos_1.launchClocByfileMultiRepos,
    'fetch-repos': launch_fetch_repos_1.launchFetchRepos,
    'pull-repos': launch_pull_repos_1.launchPullRepos,
    'cloc-diff-between-dates': cloc_diff_between_dates_1.launchDiffBetweenDatesMultiRepos
};
const functionForCommand = commandsAvailable[command];
if (functionForCommand) {
    functionForCommand();
}
else {
    if (command) {
        console.log(`Command ${command} not found`);
    }
    console.log(`Commands allowed:`);
    Object.keys(commandsAvailable).forEach(command => {
        console.log('- ' + command);
    });
}
//# sourceMappingURL=command.js.map