import { map, catchError, of } from 'rxjs';

import { executeCommandObs$ } from '../tools/execute-command/execute-command';

import { ClocDiffLanguageStats, ClocDiffState, ClocDiffStats, newClocDiffStatsWithError, newClocDiffStatsZeroed } from './cloc-diff.model';
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
 * @param repoFolderPath The path to the folder containing the Git repository. Defaults to './'.
 * @returns An Observable that emits a `ClocDiffStats` object representing the cloc diff between the two commits.
 */
export function clocDiff$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    languages: string[] = [],
) {
    const cmd = buildClocDiffRelCommand(mostRecentCommit, leastRecentCommit, languages, repoFolderPath);

    return executeCommandObs$('run cloc --git-diff-rel', cmd).pipe(
        map((output) => {
            let diffs: { [state in ClocDiffState]: ClocDiffLanguageStats; };
            try {
                diffs = JSON.parse(output);
                evaluateIfPossibleCutPaste(diffs);
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
            const err = `Error in buildClocDiffAllCommand for folder "${repoFolderPath}"\nError: ${error}
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


export function buildClocDiffRelCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './'
) {
    const cdCommand = `cd ${folderPath}`;
    const clocDiffAllCommand = `cloc --git-diff-rel --json --timeout=${CLOC_CONFIG.TIMEOUT} --ignore-whitespace`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}

function evaluateIfPossibleCutPaste(diffs: { [state in ClocDiffState]: ClocDiffLanguageStats; }) {
    const added = diffs.added;
    const removed = diffs.removed;
    const languages = Object.keys(added);
    languages.forEach((lang) => {
        const addedStats = added[lang];
        const removedStats = removed[lang];
        // isPossibleCutPaste is true if the same amount of code was added and removed, as well as the amount of blank and comment
        // lines. Also, the amount of files added and removed must be the same. Finally, the amount of code added must be greater than
        // zero and the amount of comment and blank lines must be not null and greater than zero.
        const isPossibleCutPaste = addedStats.code === removedStats.code &&
            addedStats.blank === removedStats.blank &&
            addedStats.comment === removedStats.comment &&
            addedStats.nFiles === removedStats.nFiles &&
            addedStats.code > 0 && !!addedStats.comment && !!addedStats.blank;
        // the value of possibleCutPaste is the same for both added and removed ans is set based on the above calculation
        addedStats.possibleCutPaste = isPossibleCutPaste;
        removedStats.possibleCutPaste = isPossibleCutPaste;
    })
}