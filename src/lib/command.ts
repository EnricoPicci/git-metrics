#!/usr/bin/env node

import { launchCountReposCommits } from '../apps/read-repos-commits/launch-count-repos-commits';

import { launchCodeTurnoverForRepos } from '../apps/code-turnover/launch-code-turnover';
import { launchClocByfileMultiRepos } from '../apps/cloc-byfile-multi-repos/launch-cloc-byfile-multi-repos';

import { launchFetchRepos } from '../apps/repos-utils/fetch-repos/launch-fetch-repos';
import { launchPullRepos } from '../apps/repos-utils/pull-repos/launch-pull-repos';
import { launchDiffBetweenDatesMultiRepos } from '../apps/cloc-diff-between-dates/cloc-diff-between-dates';
import { launchCheckoutAllReposAtDate } from '../apps/checkout-repos-at-date/checkout-repos-at-date';
import { launchClocBetweenDatesMultiRepos } from '../apps/cloc-between-dates/cloc-between-dates';


const command = process.argv[2];

const commandsAvailable: { [command: string]: () => void } = {
    'read-repos-commits': launchCountReposCommits,
    'code-turnover': launchCodeTurnoverForRepos,
    'cloc-byfile-multi-repos': launchClocByfileMultiRepos,
    'fetch-repos': launchFetchRepos,
    'pull-repos': launchPullRepos,
    'cloc-diff-between-dates': launchDiffBetweenDatesMultiRepos,
    'checkout-at-date': launchCheckoutAllReposAtDate,
    'cloc-between-dates': launchClocBetweenDatesMultiRepos
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


