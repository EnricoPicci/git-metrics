#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_count_repos_commits_1 = require("../apps/read-repos-commits/launch-count-repos-commits");
const launch_code_turnover_1 = require("../apps/code-turnover/launch-code-turnover");
const launch_cloc_byfile_multi_repos_1 = require("../apps/cloc-byfile-multi-repos/launch-cloc-byfile-multi-repos");
const launch_fetch_repos_1 = require("../apps/repos-utils/fetch-repos/launch-fetch-repos");
const launch_pull_repos_1 = require("../apps/repos-utils/pull-repos/launch-pull-repos");
const cloc_diff_between_dates_1 = require("../apps/cloc-diff-between-dates/cloc-diff-between-dates");
const checkout_repos_at_date_1 = require("../apps/checkout-repos-at-date/checkout-repos-at-date");
const cloc_between_dates_1 = require("../apps/cloc-between-dates/cloc-between-dates");
const command = process.argv[2];
const commandsAvailable = {
    'read-repos-commits': launch_count_repos_commits_1.launchCountReposCommits,
    'code-turnover': launch_code_turnover_1.launchCodeTurnoverForRepos,
    'cloc-byfile-multi-repos': launch_cloc_byfile_multi_repos_1.launchClocByfileMultiRepos,
    'fetch-repos': launch_fetch_repos_1.launchFetchRepos,
    'pull-repos': launch_pull_repos_1.launchPullRepos,
    'cloc-diff-between-dates': cloc_diff_between_dates_1.launchDiffBetweenDatesMultiRepos,
    'checkout-at-date': checkout_repos_at_date_1.launchCheckoutAllReposAtDate,
    'cloc-between-dates': cloc_between_dates_1.launchClocBetweenDatesMultiRepos
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