import { concatMap, filter, from, map, skip } from "rxjs";
import { executeCommandObs } from "../tools/execute-command/execute-command";
import { ignoreUpTo } from "../tools/rxjs-operators/ignore-up-to";
import { CLOC_CONFIG } from "./config";
import { newClocDiffByfile } from "./cloc-diff-byfile.model";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

/**
 * Calculates the cloc diff for each file in a Git repository between two commits, considering only the files 
 * of languages that are in the array of languages provided.
 * Returns an Observable stream of objects of type ClocDiffByfile.
 * @param mostRecentCommit The hash of the most recent commit.
 * @param leastRecentCommit The hash of the least recent commit.
 * @param repoFolderPath The path to the Git repository folder. Defaults to the current directory.
 * @param languages An array of languages for which to calculate the cloc diff. Defaults to an empty array.
 * @returns An Observable stream of objects of type ClocDiffByfile.
 */
export function clocDiffByfile$(
    mostRecentCommit: string,
    leastRecentCommit: string,
    repoFolderPath = './',
    languages: string[] = [],
) {
    const cmd = buildClocDiffRelByFileCommand(mostRecentCommit, leastRecentCommit, languages, repoFolderPath);

    return executeCommandObs('run cloc --git-diff-rel --by-file', cmd).pipe(
        map((output) => {
            return output.split('\n');
        }),
        concatMap(lines => {
            return from(lines)
        }),
        ignoreUpTo(CLOC_DIFF_BYFILE_HEADER),
        // skip the header line
        skip(1),
        filter(line => line.length > 0),
        map(line => {
            return newClocDiffByfile(line)
        })
    )
}

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export const CLOC_DIFF_BYFILE_HEADER = 'File, == blank, != blank, + blank, - blank, == comment, != comment, + comment, - comment, == code, != code, + code, - code,'

function buildClocDiffRelByFileCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './',
) {
    const cdCommand = `cd ${folderPath}`;
    let clocDiffAllCommand = `cloc --git-diff-rel --csv --by-file --timeout=${CLOC_CONFIG.TIMEOUT}`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}