import { Observable } from 'rxjs';
import { map, filter, reduce } from 'rxjs/operators';
import { CommitWithFileNumstats } from "../../../git-functions/commit.model";
import { AuthorChurn } from '../1-C-aggregate-types/author-churn';

// reads a commitLog and the cloc data from log files and returns a stream of AuthorChurn objects

export function authorChurn(commits: Observable<CommitWithFileNumstats>, after?: Date) {
    return authorChurnDictionary(commits, after).pipe(
        map((authChurnDict) => {
            return Object.values(authChurnDict).sort((a, b) => b.linesAddDel - a.linesAddDel);
        }),
    );
}

// returns a dictionary whose key is the author name and the value is an object of type AuthorChurn
export function authorChurnDictionary(commits: Observable<CommitWithFileNumstats>, after = new Date(0)) {
    return commits.pipe(
        filter((commit) => commit.files.length > 0),
        reduce((acc, commit) => {
            if (commit.committerDate < after) {
                return acc;
            }
            if (!acc[commit.authorName]) {
                acc[commit.authorName] = {
                    authorName: commit.authorName,
                    commits: 0,
                    firstCommit: new Date(),
                    lastCommit: new Date(0),
                    linesAdded: 0,
                    linesDeleted: 0,
                    linesAddDel: 0,
                };
            }
            const _authChurn = acc[commit.authorName];
            _authChurn.commits++;
            commit.files.forEach((f) => {
                _authChurn.linesAdded = _authChurn.linesAdded + (f.linesAdded || 0);
                _authChurn.linesDeleted = _authChurn.linesDeleted + (f.linesDeleted || 0);
                _authChurn.linesAddDel = _authChurn.linesAddDel + (f.linesAdded || 0) + (f.linesDeleted || 0);
                _authChurn.firstCommit =
                    !_authChurn.firstCommit || _authChurn.firstCommit > commit.committerDate
                        ? commit.committerDate
                        : _authChurn.firstCommit;
                _authChurn.lastCommit =
                    !_authChurn.lastCommit || _authChurn.lastCommit < commit.committerDate
                        ? commit.committerDate
                        : _authChurn.lastCommit;
            });
            return acc;
        }, {} as { [author: string]: AuthorChurn }),
    );
}
