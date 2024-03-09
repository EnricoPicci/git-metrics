import { Observable, concatMap, map } from "rxjs";

import { ClocDictionary } from "../cloc-functions/cloc.model";
import { CommitWithFileNumstats, GitFileNumstat } from "../git-functions/commit.model";

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */


/**
 * Takes an Observable of `CommitWithFileNumstats` objects and an Observable emitting one `ClocDictionary` object, 
 * and returns an Observable that emits a stream of `CommitWithFileNumstatsEnrichedWithCloc` objects representing 
 * the commits enriched with the number of lines of code, comments, and blanks for each file in each commit.
 * If a file present in the commit is not present in the cloc dictionary, it means that the file is either a file
 * not considered by cloc (e.g. a binary file) or a file that has been deleted after the commit was created. In this case
 * the file is enriched with 0 lines of code, comments and blanks.
 * @param commits$ An Observable of `CommitWithFileNumstats` objects representing the commits with the number of lines 
 * added and removed for each file in each commit.
 * @param clocDictionary$ An Observable of `ClocDictionary` objects representing the cloc info for each file in the repository.
 * @returns An Observable that emits a stream of `CommitWithFileNumstatsEnrichedWithCloc` objects representing the commits 
 * enriched with the number of lines of code, comments, and blanks for each file in each commit.
 */
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
    // normalize the file path so that it starts always with a './'.
    // This is necessary because the clocDictionary is created with the cloc command which returns
    // the names of the files starting with a './' while the file names in the commit are returned by the git log command
    // without the './' at the beginning.
    const filePath = file.path.startsWith('./') ? file.path : `./${file.path}`;
    // if the file is not in the cloc dictionary, it may mean different things, 
    // e.g. that it is a binary file, so we return a file with 0 lines of code, comments and blanks
    // or that it is a file that is present in an old commit but has been subsequently deleted, 
    // so we return a file with 0 lines of code, comments and blanks
    const clocData = clocDictionary[filePath]
    if (!clocData) {
        return { ...file, code: 0, comment: 0, blank: 0 };
    }
    const { code, comment, blank } = clocData;
    return { ...file, code, comment, blank };
}