"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitDaylySummary = exports.commitWithBranchTipsPerDayDictionary = void 0;
const rxjs_1 = require("rxjs");
const date_functions_1 = require("../../../0-tools/dates/date-functions");
function commitWithBranchTipsPerDayDictionary(commits) {
    return commits.pipe((0, rxjs_1.reduce)((dictStruct, commit) => {
        const dict = dictStruct.dictionary;
        const _date = (0, date_functions_1.toYYYYMMDD)(commit.committerDate);
        if (!dict[_date]) {
            dict[_date] = [];
        }
        dict[_date].push(commit);
        // save the commit as lastCommit so that at the end of the reduce cycle it holds the last commit encountered
        dictStruct.lastCommit = commit;
        return dictStruct;
    }, { dictionary: {} }));
}
exports.commitWithBranchTipsPerDayDictionary = commitWithBranchTipsPerDayDictionary;
function commitDaylySummary(commits) {
    let previousDaylySummary;
    return commitWithBranchTipsPerDayDictionary(commits).pipe((0, rxjs_1.map)(({ dictionary, lastCommit }) => {
        const daylySummaryDictionary = {};
        //
        Object.entries(dictionary)
            .sort(([day_1], [day_2]) => new Date(day_1).getTime() - new Date(day_2).getTime())
            .forEach(([day, commits]) => {
            const daylySummary = commits.reduce((summary, commit) => {
                summary.numberOfCommits++;
                if (!summary.commitHashes) {
                    summary.commitHashes = [];
                }
                summary.commitHashes.push(commit.hashShort);
                summary.branchTips = commit.branchTips;
                if (commit.parents.length > 1) {
                    summary.numberOfCommitsMergedInTheDay =
                        summary.numberOfCommitsMergedInTheDay + commit.parents.length - 1;
                }
                const { _lAdd, _lDel } = commit.files.reduce(({ _lAdd, _lDel }, file) => {
                    _lAdd = _lAdd + (file.linesAdded || 0);
                    _lDel = _lDel + (file.linesDeleted || 0);
                    return { _lAdd, _lDel };
                }, { _lAdd: 0, _lDel: 0 });
                //
                if (commit.isMerge) {
                    summary.numberOfMerges++;
                    summary.linesAddDelForMerges = summary.linesAddDelForMerges + _lAdd + _lDel;
                }
                else {
                    summary.linesAdded = summary.linesAdded + _lAdd;
                    summary.linesDeleted = summary.linesDeleted + _lDel;
                }
                return summary;
            }, {
                numberOfCommits: 0,
                deltaBranchTips: 0,
                numberOfCommitsMergedInTheDay: 0,
                numberOfCommitsWithNoFutureChildren: 0,
                day: '',
                commitHashes: [],
                branchTips: [],
                numberOfBranchTipsWhichWillHaveChildren: 0,
                numberOfMerges: 0,
                linesAddDelForMerges: 0,
                linesAdded: 0,
                linesDeleted: 0,
                linesAddDel: 0,
            });
            daylySummary.deltaBranchTips = previousDaylySummary
                ? daylySummary.branchTips.length - previousDaylySummary.branchTips.length
                : daylySummary.branchTips.length;
            daylySummary.commitsWithNoFutureChildren = intersect(daylySummary.commitHashes, lastCommit.branchTips);
            daylySummary.numberOfCommitsWithNoFutureChildren = daylySummary.commitsWithNoFutureChildren.length;
            daylySummary.numberOfBranchTipsWhichWillHaveChildren =
                daylySummary.branchTips.length - daylySummary.numberOfCommitsWithNoFutureChildren;
            daylySummary.day = day;
            daylySummary.linesAddDel = daylySummary.linesAdded + daylySummary.linesDeleted;
            daylySummaryDictionary[day] = daylySummary;
            previousDaylySummary = daylySummary;
        });
        //
        return daylySummaryDictionary;
    }));
}
exports.commitDaylySummary = commitDaylySummary;
function intersect(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    return Array.from(intersection);
}
//# sourceMappingURL=commit-branch-tips-aggregate.js.map