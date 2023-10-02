import { Observable, concatMap, map } from "rxjs";

import { ClocDictionary } from "../cloc-functions/cloc.model";
import { CommitWithFileNumstats, GitFileNumstat } from "../git-functions/commit.model";

export function commitWithFileNumstatsEnrichedWithCloc$(
    commits$: Observable<CommitWithFileNumstats>,
    clocDictionary$: Observable<ClocDictionary>,
) {
    return clocDictionary$.pipe(
        concatMap((clocDict) => {
            return commits$.pipe(
                map((commit) => newCommitWithFileNumstatsEnrichedWithCloc(commit, clocDict)),
            )
        }),
    );
}


//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

function newCommitWithFileNumstatsEnrichedWithCloc(
    commit: CommitWithFileNumstats,
    clocDictionary: ClocDictionary,
) {
    const files = commit.files.map((file) => newGitFileNumstatEnrichedWithCloc(file, clocDictionary));
    return { ...commit, files };
}

function newGitFileNumstatEnrichedWithCloc(
    file: GitFileNumstat,
    clocDictionary: ClocDictionary,
) {
    // if the file is not in the cloc dictionary, it may mean different things, 
    // e.g. that it is a binary file, so we return a file with 0 lines of code, comments and blanks
    // or that it is a file that is present in an old commit but has been subsequently deleted, 
    // so we return a file with 0 lines of code, comments and blanks
    if (!clocDictionary[file.path]) {
        return { ...file, code: 0, comment: 0, blank: 0 };
    }
    const { code, comment, blank } = clocDictionary[file.path];
    return { ...file, code, comment, blank };
}