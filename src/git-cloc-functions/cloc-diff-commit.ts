import { concatMap, map } from "rxjs";
import { clocFileDict$ } from "../cloc-functions/cloc-dictionary";
import { readCommitCompact$ } from "../git-functions/commit.functions";
import { clocDiffWithParentByfile$ } from "../cloc-functions/cloc-diff-byfile";
import { ClocDiffCommitEnriched } from "./cloc-diff-commit.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";


// clocDiffWithCommit is a function that takes a path to a git repo, a start and an end date and calculates
// the diffences between the commits in the given time range (the comparison is performed with
// the parent commit of each commit), enriched with the data retrieved using cloc (like lines
// of code, comments and blanks) as well as the data of the commit itself (like author, date, message, etc.).
// The function returns an Observable of ClocDiffCommitEnriched objects, each containing the differences for all
// the files that have changed in the single commit when compared to its parent commit.
export function clocDiffWithCommit$(
    pathToRepo: string,
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    languages: string[] = []
) {
    // first calculate the cloc dictionary and pass it down the pipe
    return clocFileDict$(pathToRepo).pipe(
        // then read the commits in the given time range and pass them down the pipe together with the cloc dictionary
        concatMap((clocFileDict) => {
            return readCommitCompact$(pathToRepo, fromDate, toDate).pipe(
                map((commit) => {
                    return { commit, clocFileDict }
                })
            )
        }),
        // then calculate the cloc diff for each commit (against its parent) and pass it down the pipe 
        // together with the cloc dictionary and the commit
        concatMap(({ commit, clocFileDict }) => {
            return clocDiffWithParentByfile$(commit.sha, pathToRepo, languages).pipe(
                map((clocDiffByfile) => {
                    return { clocDiffByfile, clocFileDict, commit }
                })
            )
        }),
        // now enrich the cloc diff with the cloc dictionary and the commit data
        map(({ clocDiffByfile, clocFileDict, commit }) => {
            let clocInfo: ClocFileInfo = clocFileDict[clocDiffByfile.file]
            if (!clocInfo) {
                clocInfo = {
                    code: 0,
                    comment: 0,
                    blank: 0,
                    language: '',
                    file: clocDiffByfile.file
                }
            }
            const clocDiffCommitEnriched: ClocDiffCommitEnriched = {
                ...clocDiffByfile,
                ...clocInfo,
                ...commit
            }
            return clocDiffCommitEnriched
        }),
    )
}