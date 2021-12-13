"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorChurnDictionary = exports.authorChurn = void 0;
const operators_1 = require("rxjs/operators");
// reads a commitLog and the cloc data from log files and returns a stream of AuthorChurn objects
function authorChurn(commits, after) {
    return authorChurnDictionary(commits, after).pipe((0, operators_1.map)((authChurnDict) => {
        return Object.values(authChurnDict).sort((a, b) => b.linesAddDel - a.linesAddDel);
    }));
}
exports.authorChurn = authorChurn;
// returns a dictionary whose key is the author name and the value is an object of type AuthorChurn
function authorChurnDictionary(commits, after) {
    return commits.pipe((0, operators_1.filter)((commit) => commit.files.length > 0), (0, operators_1.reduce)((acc, commit) => {
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
    }, {}));
}
exports.authorChurnDictionary = authorChurnDictionary;
//# sourceMappingURL=author-churn-aggregate.js.map