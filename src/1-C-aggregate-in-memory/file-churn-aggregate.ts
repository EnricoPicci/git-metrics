import { Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { FileChurn } from '../1-C-aggregate-types/file-churn';
import { FileGitCommitEnriched } from '../1-B-git-enriched-types/git-types';

// receives a stream of FileGitCommitEnriched objects and returns a stream of FileChurn objects
export function fileChurn(fileCommits: Observable<FileGitCommitEnriched>, ignoreClocZero: boolean, after?: Date) {
    return fileChurnDictionary(fileCommits, ignoreClocZero, after).pipe(
        map((fileChurnDictionary) => {
            return Object.values(fileChurnDictionary).sort((a, b) => b.linesAddDel - a.linesAddDel);
        }),
    );
}

// returns a dictionary whose key is the file path and the value is a FileChurn object with all properties filled
// exported for testing purposes only
export function fileChurnDictionary(
    fileCommits: Observable<FileGitCommitEnriched>,
    ignoreClocZero: boolean,
    after?: Date,
) {
    return fileCommits.pipe(
        reduce((acc, fileCommit) => {
            // ignore files with no cloc
            if (ignoreClocZero && !fileCommit.cloc) {
                return acc;
            }
            const fPath = fileCommit.path;
            if (!acc[fPath]) {
                acc[fPath] = {
                    path: fPath,
                    cloc: fileCommit.cloc,
                    commits: 0,
                    linesAddDel: 0,
                    linesAdded: 0,
                    linesDeleted: 0,
                    created: new Date(),
                    lastCommit: null,
                };
            }
            const fileEntry = acc[fPath];
            fileEntry.created = fileEntry.created > fileCommit.created ? fileCommit.created : fileEntry.created;
            fileEntry.lastCommit =
                fileEntry.lastCommit < fileCommit.committerDate ? fileCommit.committerDate : fileEntry.lastCommit;
            if (!after || fileCommit.committerDate >= after) {
                fileEntry.commits++;
                fileEntry.linesAdded = fileEntry.linesAdded + fileCommit.linesAdded;
                fileEntry.linesDeleted = fileEntry.linesDeleted + fileCommit.linesDeleted;
                fileEntry.linesAddDel = fileEntry.linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
            }
            return acc;
        }, {} as { [path: string]: FileChurn }),
    );
}
