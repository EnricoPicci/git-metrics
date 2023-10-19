#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_count_repos_commits_1 = require("../apps/read-repos-commits/launch-count-repos-commits");
const launch_code_turnover_1 = require("../apps/code-turnover/launch-code-turnover");
const run_reports_on_repo_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-repo");
const run_reports_on_merged_repos_1 = require("../apps/reports-on-repo/2-pipelines/run-reports-on-merged-repos");
const run_branches_report_1 = require("../apps/reports-on-repo/2-pipelines/run-branches-report");
const launch_code_turnover_and_reports_1 = require("../apps/code-turnover-and-reports/launch-code-turnover-and-reports");
const launch_cloc_byfile_for_repos_1 = require("../apps/cloc-byfile-for-repos/launch-cloc-byfile-for-repos");
const launch_cloc_diff_byfile_with_commit_1 = require("../apps/cloc-diff-byfile-with-commit/launch-cloc-diff-byfile-with-commit");
const launch_cloc_diff_byfile_with_commit_for_repos_1 = require("../apps/cloc-diff-byfile-with-commit-for-repos/launch-cloc-diff-byfile-with-commit-for-repos");
const command = process.argv[2];
const commandsAvailable = {
    'read-repos-commits': launch_count_repos_commits_1.launchCountReposCommits,
    'cloc-monthly-diff-repos': launch_code_turnover_1.launchMonthlyClocDiffRepos,
    'code-turnover': launch_code_turnover_1.launchCalculateCodeTurnover,
    'code-turnover-and-reports': launch_code_turnover_and_reports_1.launchRunReportsAndCodeTurnover,
    'run-reports-on-repo': run_reports_on_repo_1.launchReportsParallelReads,
    'run-reports-on-repos-in-folder': run_reports_on_merged_repos_1.launchAllReportsOnMergedRepos,
    'run-branches-report-on-repo': run_branches_report_1.launchBranchesReport,
    'cloc-byfile-for-repos': launch_cloc_byfile_for_repos_1.launchClocByfileForRepos,
    'cloc-diff-byfile-with-commit': launch_cloc_diff_byfile_with_commit_1.launchClocDiffByfileWithCommit,
    'cloc-diff-byfile-with-commit-for-repos': launch_cloc_diff_byfile_with_commit_for_repos_1.launchClocDiffByfileWithCommitForRepos
};
const functionForCommand = commandsAvailable[command];
if (functionForCommand) {
    functionForCommand();
}
else {
    console.log(`Command ${command} not found`);
    console.log(`Commands allowed:`);
    Object.keys(commandsAvailable).forEach(command => {
        console.log(command);
    });
}
//# sourceMappingURL=command.js.map