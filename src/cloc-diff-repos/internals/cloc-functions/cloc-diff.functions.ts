import { toArray, map, catchError, of } from "rxjs";

import { CONFIG } from "../config";
import { executeCommandObs, getCommandOutput } from "../../../0-tools/execute-command/execute-command";
import { ClocDiffStats, newClocDiffStatsWithError, newClocDiffStatsZeroed } from "./cloc-diff.model";

// runClocDiff is a function that runs the cloc command to calculate the differences (restricted to the selected languages) between 
// 2 commits of the same repo and returns the result in the form of a ClocDiffLanguageStats array
export function runClocDiff(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './'
) {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs(
        'run cloc --git-diff-all', cmd
    ).pipe(
        toArray(),
        map((linesFromStdOutAndStdErr) => {
            const output = getCommandOutput(
                linesFromStdOutAndStdErr,
                `Error in runClocDiff for folder "${folderPath}"`,
                cmd
            )

            let diffs: any
            try {
                diffs = JSON.parse(output);
            } catch (error) {
                if (output.includes('Nothing to count.')) {
                    return newClocDiffStatsZeroed(mostRecentCommit, leastRecentCommit)
                }
                const err = `Error parsing JSON returned by cloc-diff command"\nError: ${error}
Input to Json parser: ${output}
Command: ${cmd}`
                console.error(err)
                const clocOutputWithError = newClocDiffStatsWithError(mostRecentCommit, leastRecentCommit, err)
                return clocOutputWithError
            }
            const clocOutput: ClocDiffStats = {
                mostRecentCommitSha: mostRecentCommit,
                leastRecentCommitSha: leastRecentCommit,
                diffs
            }
            delete (clocOutput as any).header;
            return clocOutput;
        }),
        catchError((error) => {
            const err = `Error in buildClocDiffAllCommand for folder "${folderPath}"\nError: ${error}
Command: ${cmd}`
            console.error(err)
            console.error(`Command: ${cmd}`)
            const clocOutputWithError = newClocDiffStatsWithError(mostRecentCommit, leastRecentCommit, err)
            return of(clocOutputWithError)
        })
    );
}

export function buildClocDiffAllCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './'
) {
    const cdCommand = `cd ${folderPath}`
    const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    // const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const languagesString = languages.join(',')
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : ''
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`
}
