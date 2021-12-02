import { from, Observable } from 'rxjs';
import { concatMap, filter, reduce } from 'rxjs/operators';
import { GitCommitEnriched } from '../1-B-git-enriched-types/git-types';
import { AuthorChurn } from '../1-C-aggregate-types/author-churn';

// reads a commitLog and the cloc data from log files and returns a stream of AuthorChurn objects

export function authorChurn(commits: Observable<GitCommitEnriched>, after?: Date) {
    return authorChurnDictionary(commits, after).pipe(
        concatMap((authChurnDict) => {
            const fileChurns = Object.values(authChurnDict).sort((a, b) => b.linesAddDel - a.linesAddDel);
            return from(fileChurns);
        }),
    );
}

// returns a dictionary whose key is the author name and the value is an object of type AuthorChurn
export function authorChurnDictionary(commits: Observable<GitCommitEnriched>, after?: Date) {
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
                    firstCommit: undefined,
                    lastCommit: undefined,
                    linesAdded: 0,
                    linesDeleted: 0,
                    linesAddDel: 0,
                };
            }
            const _authChurn = acc[commit.authorName];
            _authChurn.commits++;
            commit.files.forEach((f) => {
                _authChurn.linesAdded = _authChurn.linesAdded + f.linesAdded;
                _authChurn.linesDeleted = _authChurn.linesDeleted + f.linesDeleted;
                _authChurn.linesAddDel = _authChurn.linesAddDel + f.linesAdded + f.linesDeleted;
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
