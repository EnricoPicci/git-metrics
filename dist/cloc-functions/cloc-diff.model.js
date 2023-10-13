"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDiffsClocDiffStats = exports.newClocDiffStatsWithError = exports.newClocDiffStatsZeroed = exports.newClocDiffStats = void 0;
function newClocDiffStats() {
    return {
        diffs: {
            same: {},
            modified: {},
            added: {},
            removed: {},
        },
    };
}
exports.newClocDiffStats = newClocDiffStats;
function newClocDiffStatsZeroed(mostRecentCommitSha, leastRecentCommitSha, error) {
    return {
        mostRecentCommitSha,
        leastRecentCommitSha,
        diffs: {
            same: {},
            modified: {},
            added: {},
            removed: {},
        },
        error
    };
}
exports.newClocDiffStatsZeroed = newClocDiffStatsZeroed;
function newClocDiffStatsWithError(mostRecentCommitSha, leastRecentCommitSha, error) {
    return newClocDiffStatsZeroed(mostRecentCommitSha, leastRecentCommitSha, error);
}
exports.newClocDiffStatsWithError = newClocDiffStatsWithError;
function newDiffsClocDiffStats(languages) {
    const clocDiffStats = newClocDiffStats();
    return languages.reduce((acc, lang) => {
        const clocDiffLanguageStats = {};
        clocDiffLanguageStats[lang] = {
            nFiles: 0,
            blank: 0,
            comment: 0,
            code: 0,
            possibleCutPaste: false,
        };
        acc.diffs.added = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.removed = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.modified = Object.assign({}, clocDiffLanguageStats);
        acc.diffs.same = Object.assign({}, clocDiffLanguageStats);
        return acc;
    }, clocDiffStats);
}
exports.newDiffsClocDiffStats = newDiffsClocDiffStats;
//# sourceMappingURL=cloc-diff.model.js.map