import { from, Observable } from 'rxjs';
import { concatMap, reduce } from 'rxjs/operators';
import { FileChurn } from '../aggregate-types/file-churn';
import { FileGitCommitEnriched } from '../git-enriched-types/git-types';

// receives a stream of FileGitCommitEnriched objects and returns a stream of FileChurn objects
export function fileChurn(fileCommits: Observable<FileGitCommitEnriched>, after?: Date) {
    return fileChurnDictionary(fileCommits, after).pipe(
        concatMap((fileChurnDictionary) => {
            const fileChurns = Object.values(fileChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
            return from(fileChurns);
        }),
    );
}

// returns a dictionary whose key is the file path and the value is a FileChurn object with all properties filled
// exported for testing purposes only
export function fileChurnDictionary(fileCommits: Observable<FileGitCommitEnriched>, after?: Date) {
    return fileCommits.pipe(
        reduce((acc, fileCommit) => {
            if (fileCommit.committerDate < after) {
                return acc;
            }
            if (!acc[fileCommit.path]) {
                acc[fileCommit.path] = {
                    path: fileCommit.path,
                    cloc: fileCommit.cloc ?? 0,
                    commits: 0,
                    linesAddDel: 0,
                    linesAdded: 0,
                    linesDeleted: 0,
                    created: new Date(),
                };
            }
            const fileEntry = acc[fileCommit.path];
            fileEntry.commits++;
            fileEntry.linesAdded = fileEntry.linesAdded + fileCommit.linesAdded;
            fileEntry.linesDeleted = fileEntry.linesDeleted + fileCommit.linesDeleted;
            fileEntry.linesAddDel = fileEntry.linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
            fileEntry.created =
                fileEntry.created > fileCommit.committerDate ? fileCommit.committerDate : acc[fileCommit.path].created;
            return acc;
        }, {} as { [path: string]: FileChurn }),
    );
}
