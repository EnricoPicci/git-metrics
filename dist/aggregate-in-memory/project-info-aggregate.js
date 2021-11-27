"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectCommitsInfo = exports.projectInfo = void 0;
const operators_1 = require("rxjs/operators");
function projectInfo(commits, clocSummaryInfo) {
    return _projectCommitsInfo(commits).pipe((0, operators_1.map)((commits) => ({ commits })), (0, operators_1.concatMap)((prjInfo) => clocSummaryInfo.pipe((0, operators_1.map)((clocSummaryInfo) => (Object.assign({ clocSummaryInfo }, prjInfo))))), (0, operators_1.tap)({
        next: () => console.log(`====>>>> GENERAL PROJECT INFO CALCULATED`),
    }));
}
exports.projectInfo = projectInfo;
function projectCommitsInfo(commits) {
    return commits.reduce((commitsInfo, commit) => {
        commitsInfo.count++;
        commitsInfo.first.committerDate =
            commitsInfo.first.committerDate > commit.committerDate
                ? commit.committerDate
                : commitsInfo.first.committerDate;
        commitsInfo.last.committerDate =
            commitsInfo.last.committerDate < commit.committerDate
                ? commit.committerDate
                : commitsInfo.last.committerDate;
        return commitsInfo;
    }, {
        count: 0,
        first: {
            committerDate: new Date(),
        },
        last: {
            // smallest date see: https://stackoverflow.com/a/11526569/5699993
            committerDate: new Date(-8640000000000000),
        },
    });
}
exports.projectCommitsInfo = projectCommitsInfo;
function _projectCommitsInfo(commits) {
    return commits.pipe((0, operators_1.reduce)((commitsInfo, commit) => {
        commitsInfo.count++;
        commitsInfo.first.committerDate =
            commitsInfo.first.committerDate > commit.committerDate
                ? commit.committerDate
                : commitsInfo.first.committerDate;
        commitsInfo.last.committerDate =
            commitsInfo.last.committerDate < commit.committerDate
                ? commit.committerDate
                : commitsInfo.last.committerDate;
        return commitsInfo;
    }, {
        count: 0,
        first: {
            committerDate: new Date(),
        },
        last: {
            // smallest date see: https://stackoverflow.com/a/11526569/5699993
            committerDate: new Date(-8640000000000000),
        },
    }));
}
//# sourceMappingURL=project-info-aggregate.js.map