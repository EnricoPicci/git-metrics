"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newSummaryStatsByNumDays = exports.newSummaryStatsByAuthor = exports.newSummaryStatsByMonth = exports.newStatsByMonth = exports.newMergeRequestAnalysis = void 0;
function newMergeRequestAnalysis(mergeRequestsCompact) {
    return {
        mergeRequestsCompact: mergeRequestsCompact,
        createdByMonth: new Map(),
        mergedByMonth: new Map(),
        closedByMonth: new Map(),
        byNumOfDaysToMerge: new Map(),
        byNumOfDaysToClose: new Map(),
        bugFixes: [],
        bugFixesCreatedByMonth: new Map(),
        bugFixesMergedByMonth: new Map(),
        bugFixesClosedByMonth: new Map(),
        bugFixesByNumOfDaysToMerge: new Map(),
        bugFixesByNumOfDaysToClose: new Map(),
        features: [],
        featuresCreatedByMonth: new Map(),
        featuresMergedByMonth: new Map(),
        featuresClosedByMonth: new Map(),
        featuresByNumOfDaysToMerge: new Map(),
        featuresByNumOfDaysToClose: new Map(),
        summary: {
            numberOfMergeRequests: 0,
            numberOfBugFixes: 0,
            numberOfFeatures: 0,
        },
        summaryStatsByMonth: new Map(),
        summaryStatsByNumDays: newSummaryStatsByNumDays(),
        summaryStatsByAuthor: newSummaryStatsByAuthor()
    };
}
exports.newMergeRequestAnalysis = newMergeRequestAnalysis;
function newStatsByMonth() {
    return {
        mergeRequestsCreated: 0,
        mergeRequestsMerged: 0,
        mergeRequestsClosed: 0,
        bugFixesCreated: 0,
        bugFixesMerged: 0,
        bugFixesClosed: 0,
        featuresCreated: 0,
        featuresMerged: 0,
        featuresClosed: 0,
    };
}
exports.newStatsByMonth = newStatsByMonth;
function newSummaryStatsByMonth() {
    return new Map();
}
exports.newSummaryStatsByMonth = newSummaryStatsByMonth;
function newSummaryStatsByAuthor() {
    return new Map();
}
exports.newSummaryStatsByAuthor = newSummaryStatsByAuthor;
function newSummaryStatsByNumDays() {
    return {
        numMergeRequestsByNumOfDaysToMerge: new Map(),
        numMergeRequestsByNumOfDaysToClose: new Map(),
        numBugFixesByNumOfDaysToMerge: new Map(),
        numBugFixesByNumOfDaysToClose: new Map(),
        numFeaturesByNumOfDaysToMerge: new Map(),
        numFeaturesByNumOfDaysToClose: new Map(),
    };
}
exports.newSummaryStatsByNumDays = newSummaryStatsByNumDays;
//# sourceMappingURL=analyze-merge-requests.model.js.map