import { map, toArray } from "rxjs";
import { executeCommandObs } from "../execute-command/execute-command";

import { ClocLanguageStats } from "./cloc.model";
import { CONFIG } from "../config";

// runCloc is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
export function runCloc(repoPathOrCommitOrOtherClocId: string, folderPath = './') {
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs('run cloc', `cd ${folderPath} && cloc --json --timeout=${CONFIG.CLOC_TIMEOUT} ${repoPathOrCommitOrOtherClocId}`).pipe(
        toArray(),
        map((output) => {
            const firstLine = output[0]
            if (firstLine.startsWith('from stderr: ')) {
                console.error(`Error in runCloc for folder "${folderPath}" and path "${repoPathOrCommitOrOtherClocId}"\nError: ${firstLine}`)
                return [];
            }
            if (!firstLine.startsWith('from stdout: ')) {
                throw new Error('We expect the first line to start with "from stdout: "')
            }
            output[0] = firstLine.substring('from stdout: '.length)
            const clocOutputJson = JSON.parse(output.join('\n'));
            const clocStatsArray: ClocLanguageStats[] = []
            Object.entries(clocOutputJson).forEach(([language, stats]: [string, any]) => {
                if (language !== 'header') {
                    const langStats: ClocLanguageStats = {
                        language,
                        nFiles: stats.nFiles,
                        blank: stats.blank,
                        comment: stats.comment,
                        code: stats.code,
                    }
                    clocStatsArray.push(langStats);
                }
            });
            return clocStatsArray;
        })
    );
}