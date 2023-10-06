"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocDiffStatToCsvWithBase = void 0;
function clocDiffStatToCsvWithBase(clocDiffStat, base) {
    const { repoPath, leastRecentCommit, mostRecentCommit } = base;
    let sameFlat = [];
    if (!clocDiffStat) {
        console.warn('!!!!!!!!! No SAME stats for ${repoPath}');
    }
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same)
            .map(([language, clocStats]) => {
            return Object.entries(clocStats)
                .map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'same', language, stat, value });
            })
                .flat();
        })
            .flat();
    }
    else {
        console.warn(`!!!!!!!!! No SAME stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let addedFlat = [];
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added)
            .map(([language, clocStats]) => {
            return Object.entries(clocStats)
                .map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'added', language, stat, value });
            })
                .flat();
        })
            .flat();
    }
    else {
        console.warn(`!!!!!!!!! No ADDED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let removedFlat = [];
    if (clocDiffStat.removed) {
        removedFlat = Object.entries(clocDiffStat.removed)
            .map(([language, clocStats]) => {
            return Object.entries(clocStats)
                .map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'removed', language, stat, value });
            })
                .flat();
        })
            .flat();
    }
    else {
        console.warn(`!!!!!!!!! No REMOVED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let modifiedFlat = [];
    if (clocDiffStat.modified) {
        modifiedFlat = Object.entries(clocDiffStat.modified)
            .map(([language, clocStats]) => {
            return Object.entries(clocStats)
                .map(([stat, value]) => {
                return Object.assign(Object.assign({}, base), { diffType: 'modified', language, stat, value });
            })
                .flat();
        })
            .flat();
    }
    else {
        console.warn(`!!!!!!!!! No MODIFIED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    const csvRecords = [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat];
    return csvRecords;
}
exports.clocDiffStatToCsvWithBase = clocDiffStatToCsvWithBase;
//# sourceMappingURL=cloc-diff-stat-csv.js.map