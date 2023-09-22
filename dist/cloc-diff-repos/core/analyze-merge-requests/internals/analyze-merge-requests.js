"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillGapsInSummaryStatsByMonth = exports.getMinMaxYearMonth = exports.runAnalysis = exports.runMergeRequestAnalysis = void 0;
const rxjs_1 = require("rxjs");
const analyze_merge_requests_model_1 = require("./analyze-merge-requests.model");
const merge_requests_functions_1 = require("../../../internals/gitlab-functions/merge-requests.functions");
function runMergeRequestAnalysis(gitLabUrl, token, groupId) {
    return (0, merge_requests_functions_1.readMergeRequestsForGroup)(gitLabUrl, token, groupId).pipe((0, rxjs_1.map)((mergeRequests) => (0, merge_requests_functions_1.toMergeRequestCompact)(mergeRequests)), (0, rxjs_1.map)(mergeRequestsCompact => {
        return runAnalysis(mergeRequestsCompact);
    }));
}
exports.runMergeRequestAnalysis = runMergeRequestAnalysis;
function runAnalysis(mergeRequestsCompact) {
    const mergeRequestAnalysis = (0, analyze_merge_requests_model_1.newMergeRequestAnalysis)(mergeRequestsCompact);
    let minYearMonth = '9999-12';
    let maxYearMonth = '0000-01';
    const analysisResult = mergeRequestsCompact.reduce((analysis, mergeRequest) => {
        addToMapOfArrays(analysis.createdByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest);
        addToMapOfArrays(analysis.mergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest);
        addToMapOfArrays(analysis.closedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest);
        addToMapOfArrays(analysis.byNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest);
        addToMapOfArrays(analysis.byNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest);
        if (mergeRequest.isLikelyBug) {
            analysis.bugFixes.push(mergeRequest);
            addToMapOfArrays(analysis.bugFixesCreatedByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.bugFixesMergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.bugFixesClosedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.bugFixesByNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest);
            addToMapOfArrays(analysis.bugFixesByNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest);
        }
        else {
            analysis.features.push(mergeRequest);
            addToMapOfArrays(analysis.featuresCreatedByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.featuresMergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.featuresClosedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest);
            addToMapOfArrays(analysis.featuresByNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest);
            addToMapOfArrays(analysis.featuresByNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest);
        }
        addMergeRequestToSummaryByNumOfDays(mergeRequest, analysis.summaryStatsByNumDays);
        fillSummaryByMonth(mergeRequest, analysis.summaryStatsByMonth);
        fillSummaryByAuthor(mergeRequest, analysis.summaryStatsByAuthor);
        // store the min and max year_month values through the iterations
        const [min, max] = getMinMaxYearMonth([
            mergeRequest.created_at_YYYY_MM,
            mergeRequest.merged_at_YYYY_MM,
            mergeRequest.closed_at_YYYY_MM
        ].filter(yearMonth => yearMonth.length > 0));
        minYearMonth = minYearMonth > min ? min : minYearMonth;
        maxYearMonth = maxYearMonth < max ? max : maxYearMonth;
        return analysis;
    }, mergeRequestAnalysis);
    fillSummary(analysisResult);
    fillGapsInSummaryStatsByMonth(analysisResult.summaryStatsByMonth, minYearMonth, maxYearMonth);
    sortSummaries(analysisResult);
    return analysisResult;
}
exports.runAnalysis = runAnalysis;
function getMinMaxYearMonth(yearMonths) {
    var minYearMonth = yearMonths[0];
    var maxYearMonth = yearMonths[0];
    for (let a of yearMonths) {
        if (a < minYearMonth)
            minYearMonth = a;
        if (a > maxYearMonth)
            maxYearMonth = a;
    }
    return [minYearMonth, maxYearMonth];
}
exports.getMinMaxYearMonth = getMinMaxYearMonth;
function addMergeRequestToSummaryByNumOfDays(mergeRequest, summaryStatsByNumDays) {
    increaseCountInMap(summaryStatsByNumDays.numMergeRequestsByNumOfDaysToMerge, mergeRequest.days_to_merge);
    increaseCountInMap(summaryStatsByNumDays.numMergeRequestsByNumOfDaysToClose, mergeRequest.days_to_close);
    if (mergeRequest.isLikelyBug) {
        increaseCountInMap(summaryStatsByNumDays.numBugFixesByNumOfDaysToMerge, mergeRequest.days_to_merge);
        increaseCountInMap(summaryStatsByNumDays.numBugFixesByNumOfDaysToClose, mergeRequest.days_to_close);
    }
    else {
        increaseCountInMap(summaryStatsByNumDays.numFeaturesByNumOfDaysToMerge, mergeRequest.days_to_merge);
        increaseCountInMap(summaryStatsByNumDays.numFeaturesByNumOfDaysToClose, mergeRequest.days_to_close);
    }
}
function increaseCountInMap(map, key) {
    if (!key) {
        return;
    }
    if (!map.has(key)) {
        map.set(key, 0);
    }
    map.set(key, map.get(key) + 1);
}
function addToMapOfArrays(map, key, value) {
    if (!key) {
        return;
    }
    if (!map.has(key)) {
        map.set(key, []);
    }
    map.get(key).push(value);
}
function fillSummaryByMonth(mergeRequest, summaryStatsByMonth) {
    const created = mergeRequest.created_at_YYYY_MM;
    const merged = mergeRequest.merged_at_YYYY_MM;
    const closed = mergeRequest.closed_at_YYYY_MM;
    if (!!created && !summaryStatsByMonth.has(created)) {
        summaryStatsByMonth.set(created, (0, analyze_merge_requests_model_1.newStatsByMonth)());
    }
    if (!!merged && !summaryStatsByMonth.has(merged)) {
        summaryStatsByMonth.set(merged, (0, analyze_merge_requests_model_1.newStatsByMonth)());
    }
    if (!!closed && !summaryStatsByMonth.has(closed)) {
        summaryStatsByMonth.set(closed, (0, analyze_merge_requests_model_1.newStatsByMonth)());
    }
    summaryStatsByMonth.get(created).mergeRequestsCreated++;
    if (!!mergeRequest.merged_at_YYYY_MM) {
        summaryStatsByMonth.get(merged).mergeRequestsMerged++;
    }
    if (!!closed) {
        summaryStatsByMonth.get(closed).mergeRequestsClosed++;
    }
    if (mergeRequest.isLikelyBug) {
        summaryStatsByMonth.get(created).bugFixesCreated++;
        if (!!merged) {
            summaryStatsByMonth.get(merged).bugFixesMerged++;
        }
        if (!!closed) {
            summaryStatsByMonth.get(closed).bugFixesClosed++;
        }
    }
    else {
        summaryStatsByMonth.get(created).featuresCreated++;
        if (!!merged) {
            summaryStatsByMonth.get(merged).featuresMerged++;
        }
        if (!!closed) {
            summaryStatsByMonth.get(closed).featuresClosed++;
        }
    }
}
function fillSummaryByAuthor(mergeRequest, summaryStatsByAuthor) {
    const author = mergeRequest.author;
    increaseCountInMap(summaryStatsByAuthor, author);
}
function fillSummary(mergeRequestAnalysis) {
    mergeRequestAnalysis.summary = {
        numberOfMergeRequests: mergeRequestAnalysis.mergeRequestsCompact.length,
        numberOfBugFixes: mergeRequestAnalysis.bugFixes.length,
        numberOfFeatures: mergeRequestAnalysis.features.length,
    };
    mergeRequestAnalysis.summaryStatsByMonth;
}
function fillGapsInSummaryStatsByMonth(summaryStatsByMonth, minYearMonth, maxYearMonth) {
    let yearMonth = minYearMonth;
    while (yearMonth <= maxYearMonth) {
        if (!summaryStatsByMonth.has(yearMonth)) {
            summaryStatsByMonth.set(yearMonth, {
                mergeRequestsCreated: 0,
                mergeRequestsMerged: 0,
                mergeRequestsClosed: 0,
                bugFixesCreated: 0,
                bugFixesMerged: 0,
                bugFixesClosed: 0,
                featuresCreated: 0,
                featuresMerged: 0,
                featuresClosed: 0,
            });
        }
        yearMonth = nextYearMonth(yearMonth);
    }
    return summaryStatsByMonth;
}
exports.fillGapsInSummaryStatsByMonth = fillGapsInSummaryStatsByMonth;
function nextYearMonth(yearMonth) {
    const [yearString, monthString] = yearMonth.split('-');
    const year = parseInt(yearString);
    const month = parseInt(monthString);
    if (month === 12) {
        return `${year + 1}-01`;
    }
    else {
        const monthString = (month + 1).toString().padStart(2, '0');
        return `${year}-${monthString}`;
    }
}
// sortSummaries sorts all the summaries present in the analysisResult
function sortSummaries(analysisResult) {
    // sort summaryStatsByMonth
    analysisResult.summaryStatsByMonth = new Map([...analysisResult.summaryStatsByMonth.entries()].sort());
    // sort summaryStatsByAuthor
    analysisResult.summaryStatsByAuthor = new Map([...analysisResult.summaryStatsByAuthor.entries()].sort((a, b) => b[1] - a[1]));
    // sort summaryStatsByNumDays
    const summaryStatsByNumDaysSorted = {};
    Object.entries(analysisResult.summaryStatsByNumDays).forEach(([key, value]) => {
        summaryStatsByNumDaysSorted[key] = new Map([...value.entries()].sort());
    });
    analysisResult.summaryStatsByNumDays = summaryStatsByNumDaysSorted;
}
//# sourceMappingURL=analyze-merge-requests.js.map