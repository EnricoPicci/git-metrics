import { map, catchError, of } from 'rxjs';

import { executeCommandObs } from '../tools/execute-command/execute-command';

import { ClocDiffStats, newClocDiffStatsWithError, newClocDiffStatsZeroed } from './cloc-diff.model';
import { CLOC_CONFIG } from './config';

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Runs the cloc command to calculate the differences (restricted to the selected languages) between 2 commits of the same 
 * repo and returns the result in the form of a `ClocDiffLanguageStats` Observable stream.
 * @param mostRecentCommit The SHA of the most recent commit.
 * @param leastRecentCommit The SHA of the least recent commit.
 * @param languages An array of languages to include in the cloc diff.
 * @param folderPath The path to the folder containing the Git repository. Defaults to './'.
 * @returns An Observable that emits a `ClocDiffStats` object representing the cloc diff between the two commits.
 */
export function runClocDiff(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './',
) {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs('run cloc --git-diff-all', cmd).pipe(
        map((output) => {
            let diffs: any;
            try {
                diffs = JSON.parse(output);
            } catch (error) {
                if (output.includes('Nothing to count.')) {
                    return newClocDiffStatsZeroed(mostRecentCommit, leastRecentCommit);
                }
                const err = `Error parsing JSON returned by cloc-diff command"\nError: ${error}
Input to Json parser: ${output}
Command: ${cmd}`;
                console.error(err);
                const clocOutputWithError = newClocDiffStatsWithError(mostRecentCommit, leastRecentCommit, err);
                return clocOutputWithError;
            }
            const clocOutput: ClocDiffStats = {
                mostRecentCommitSha: mostRecentCommit,
                leastRecentCommitSha: leastRecentCommit,
                diffs,
            };
            return clocOutput;
        }),
        catchError((error) => {
            const err = `Error in buildClocDiffAllCommand for folder "${folderPath}"\nError: ${error}
Command: ${cmd}`;
            console.error(err);
            console.error(`Command: ${cmd}`);
            const clocOutputWithError = newClocDiffStatsWithError(mostRecentCommit, leastRecentCommit, err);
            return of(clocOutputWithError);
        }),
    );
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes


export function buildClocDiffAllCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './',
) {
    const cdCommand = `cd ${folderPath}`;
    const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${CLOC_CONFIG.TIMEOUT}`;
    // const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}
