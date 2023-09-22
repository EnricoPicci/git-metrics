import { map } from "rxjs";
import { executeCommandObs } from "../0-tools/execute-command/execute-command";

import { ClocLanguageStats } from "./cloc.model";
import { CONFIG } from "../config";

// runCloc is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
export function runCloc(repoPath = './', vcs?: string) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs('run cloc', `cloc --json ${_vcs} --timeout=${CONFIG.CLOC_TIMEOUT} ${repoPath}`).pipe(
        map((output) => {
            const clocOutputJson = JSON.parse(output);
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