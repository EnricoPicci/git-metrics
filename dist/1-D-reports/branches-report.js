"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConsiderationsForBranchesReport = exports.branchesReportCore = exports.branchesReport = exports.projectAndBranchesReport = exports.BranchesReport = exports.BRANCHES_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const date_functions_1 = require("../0-tools/dates/date-functions");
const to_csv_1 = require("../0-tools/csv/to-csv");
const add_project_info_1 = require("./add-project-info");
const report_1 = require("./report");
exports.BRANCHES_REPORT_NAME = 'BranchesReport';
class BranchesReport extends report_1.Report {
    //
    constructor(_params) {
        super(_params);
        this.totMerges = { val: 0, description: `The total number of merges.` };
        this.averageLinesAddDelForMerge = {
            val: 0,
            description: `Average number of lines added or deleted in the merges. Small merges (i.e. a low average) are 
likely easier to manage, reduce complexity and are probably a signal of a well executed trunk-based development`,
        };
        this.maxCommits = { val: 0, description: `Maximum number of commits in a day.` };
        this.maxMerges = { val: 0, description: `Maximum number of commits merged in a day.` };
        this.branchTips = {
            val: [],
            description: `Commits with no children which therefore represents  a proxy of the tips of the branches in the repo. This is a proxy since 
also staches are commits that do not have children but are not really branches. It is also possible to check out an old commit and produce some changes and
a new commit without actually attaching to this commit a branch name. In any case the normal case is to have a branch created out of a commit and this is why this
list is a good approximation of all the branches open in the repo as of now.`,
        };
        this.maxBranchTips = { val: 0, description: `Maximum number of branch tips availbale at the end of a day.` };
        this.weeklyCsvFile = { val: '', description: `File where the weekly evolution of commits and branches is registerer.` };
        this.name = exports.BRANCHES_REPORT_NAME;
        this.description = `Report on the evolution of branches over time`;
    }
}
exports.BranchesReport = BranchesReport;
// API to be used if we want to generate the report for the general project as well as the report about branches
// reads also from the repo folder for information about the files currently in the project
function projectAndBranchesReport(commitDaylySummary, projectInfo, params, csvFilePath, weeklyCsvFilePath) {
    return projectInfo.pipe((0, operators_1.concatMap)((prjInfo) => branchesReport(commitDaylySummary, params, prjInfo, csvFilePath, weeklyCsvFilePath)));
}
exports.projectAndBranchesReport = projectAndBranchesReport;
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of CommitDaylySummary objects
function branchesReport(commitDaylySummary, params, projectInfo, csvFilePath, weeklyCsvFilePath) {
    return branchesReportCore(commitDaylySummary, params, csvFilePath, weeklyCsvFilePath).pipe((0, operators_1.tap)((report) => {
        (0, add_project_info_1.addProjectInfo)(report, projectInfo, csvFilePath);
    }), (0, operators_1.map)((report) => addConsiderationsForBranchesReport(report)));
}
exports.branchesReport = branchesReport;
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of CommitDaylySummary objects, like when we create the report from a Mongo query
function branchesReportCore(commitDaylySummary, params, csvFilePath, weeklyCsvFilePath) {
    const commitDaylySummarySource = commitDaylySummary.pipe((0, operators_1.map)((daylySummaryDictionary) => {
        // sort dayly summaries from the eldest, which has the smallest time, to the newer =, which has the biggest time
        const daylyCommitSummariesSorted = Object.values(daylySummaryDictionary).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
        return daylyCommitSummariesSorted;
    }), (0, operators_1.tap)((commitDaylySummaries) => {
        console.log(`Processing ${commitDaylySummaries.length} records to generate BranchesReport`);
    }), (0, operators_1.share)());
    const generateReport = commitDaylySummarySource.pipe(_branchesReport(params));
    const concurrentStreams = [
        generateReport,
    ];
    if (csvFilePath) {
        if (!weeklyCsvFilePath) {
            throw new Error('weeklyCsvFilePath has to be specified');
        }
        const allDaylySummary = commitDaylySummarySource;
        concurrentStreams.push(allDaylySummary);
        return (0, rxjs_1.forkJoin)(concurrentStreams).pipe((0, operators_1.concatMap)(([report, allCommitDaylySummaries]) => {
            report.csvFile.val = csvFilePath;
            report.weeklyCsvFile.val = weeklyCsvFilePath;
            const csvLines = mapDaylySummariesToCsv(allCommitDaylySummaries);
            const weeklyCsvLines = weeklySummariesToCsv(allCommitDaylySummaries);
            return (0, rxjs_1.forkJoin)([
                (0, observable_fs_1.writeFileObs)(csvFilePath, csvLines),
                (0, observable_fs_1.writeFileObs)(weeklyCsvFilePath, weeklyCsvLines),
            ]).pipe((0, operators_1.map)(([csvFile, weeklyCsvFile]) => [report, csvFile, weeklyCsvFile]));
        }), (0, operators_1.tap)({
            next: ([, csvFile, weeklyCsvFile]) => {
                console.log(`====>>>> BRANCH REPORT GENERATED -- data saved in ${csvFile}`);
                console.log(`====>>>> BRANCH WEEKLY REPORT GENERATED -- data saved in ${weeklyCsvFile}`);
            },
        }), (0, operators_1.map)(([report]) => report));
    }
    return generateReport.pipe((0, operators_1.tap)({
        next: () => {
            console.log(`====>>>> BRANCH REPORT GENERATED`);
        },
    }));
}
exports.branchesReportCore = branchesReportCore;
function _branchesReport(params) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((daylyCommitSummariesSorted) => {
        const r = new BranchesReport(params);
        let totMerges = 0;
        let totLinesAddDelForMerges = 0;
        let maxCommits = 0;
        let maxMerges = 0;
        let maxBranchTips = 0;
        daylyCommitSummariesSorted.forEach((daylyCommitSummary) => {
            totMerges = totMerges + daylyCommitSummary.numberOfMerges;
            totLinesAddDelForMerges = totLinesAddDelForMerges + daylyCommitSummary.linesAddDelForMerges;
            maxCommits =
                maxCommits < daylyCommitSummary.numberOfCommits ? daylyCommitSummary.numberOfCommits : maxCommits;
            maxMerges =
                maxMerges < daylyCommitSummary.numberOfCommitsMergedInTheDay
                    ? daylyCommitSummary.numberOfCommitsMergedInTheDay
                    : maxMerges;
            maxBranchTips =
                maxBranchTips < daylyCommitSummary.branchTips.length
                    ? daylyCommitSummary.branchTips.length
                    : maxBranchTips;
        });
        r.totMerges.val = totMerges;
        r.averageLinesAddDelForMerge.val = Math.round(totLinesAddDelForMerges / totMerges);
        r.maxCommits.val = maxCommits;
        r.maxMerges.val = maxMerges;
        r.maxBranchTips.val = maxBranchTips;
        r.branchTips.val = daylyCommitSummariesSorted[daylyCommitSummariesSorted.length - 1].branchTips;
        return r;
    }));
}
function mapDaylySummariesToCsv(allCommitDaylySummaries) {
    const allCommitDaylySummariesCsvRecords = allCommitDaylySummaries.map((commitSummary) => {
        const csvRec = {
            day: commitSummary.day,
            numberOfCommits: commitSummary.numberOfCommits,
            linesAdded: commitSummary.linesAdded,
            linesDeleted: commitSummary.linesDeleted,
            linesAddDel: commitSummary.linesAddDel,
            numberOfMerges: commitSummary.numberOfMerges,
            linesAddDelForMerges: commitSummary.linesAddDelForMerges,
            averageLinesAddDelForMerges: commitSummary.numberOfMerges
                ? Math.round(commitSummary.linesAddDelForMerges / commitSummary.numberOfMerges)
                : 0,
            branchTips: commitSummary.branchTips.length,
            deltaBranchTips: commitSummary.deltaBranchTips,
            numberOfCommitsMergedInTheDay: commitSummary.numberOfCommitsMergedInTheDay,
            numberOfCommitsWithNoFutureChildren: commitSummary.numberOfCommitsWithNoFutureChildren,
            numberOfBranchTipsWhichWillHaveChildren: commitSummary.numberOfBranchTipsWhichWillHaveChildren,
            commitsWithNoFutureChildren: commitSummary.commitsWithNoFutureChildren,
        };
        return csvRec;
    });
    return (0, to_csv_1.toCsv)(allCommitDaylySummariesCsvRecords);
}
function weeklySummariesToCsv(allCommitDaylySummaries) {
    const firstDay = allCommitDaylySummaries[0].day;
    const lastDay = allCommitDaylySummaries[allCommitDaylySummaries.length - 1].day;
    const daysWeeksDict = (0, date_functions_1.dayToWeekDictionary)(new Date(firstDay), new Date(lastDay));
    const weeklySummaryDict = {};
    let csvRec;
    // we use previousCommitSummaryDate to make sure that the sequence is what we expect
    let previousCommitSummaryDate;
    allCommitDaylySummaries.forEach((commitSummary) => {
        const _week = daysWeeksDict[commitSummary.day];
        if (new Date(previousCommitSummaryDate) >= new Date(commitSummary.day)) {
            throw new Error(`Day ${commitSummary.day} is before ${previousCommitSummaryDate}`);
        }
        if (!previousCommitSummaryDate) {
            previousCommitSummaryDate = allCommitDaylySummaries[0].day;
        }
        if (!_week) {
            throw new Error(`Day ${commitSummary.day} not found`);
        }
        if (!weeklySummaryDict[_week]) {
            weeklySummaryDict[_week] = {
                weekStart: _week,
                numberOfCommits: 0,
                linesAdded: 0,
                linesDeleted: 0,
                linesAddDel: 0,
                numberOfMerges: 0,
                linesAddDelForMerges: 0,
                averageLinesAddDelForMerges: 0,
                branchTips: 0,
                numberOfCommitsMergedInTheWeek: 0,
                numberOfCommitsWithNoFutureChildren: 0,
            };
        }
        csvRec = weeklySummaryDict[_week];
        csvRec.numberOfCommits = csvRec.numberOfCommits + commitSummary.numberOfCommits;
        csvRec.linesAdded = csvRec.linesAdded + commitSummary.linesAdded;
        csvRec.linesDeleted = csvRec.linesDeleted + commitSummary.linesDeleted;
        csvRec.linesAddDel = csvRec.linesAddDel + commitSummary.linesAddDel;
        //
        csvRec.numberOfMerges = csvRec.numberOfMerges + commitSummary.numberOfMerges;
        csvRec.linesAddDelForMerges = csvRec.linesAddDelForMerges + commitSummary.linesAddDelForMerges;
        csvRec.averageLinesAddDelForMerges = csvRec.numberOfMerges
            ? Math.round(csvRec.linesAddDelForMerges / csvRec.numberOfMerges)
            : 0;
        //
        csvRec.numberOfCommitsMergedInTheWeek =
            csvRec.numberOfCommitsMergedInTheWeek + commitSummary.numberOfCommitsMergedInTheDay;
        csvRec.numberOfCommitsWithNoFutureChildren =
            csvRec.numberOfCommitsWithNoFutureChildren + commitSummary.numberOfCommitsWithNoFutureChildren;
        // we take the last summary day of the week, assuming the sequence is sorted from the eldest to the newest, to set the
        // branchTips value of the week as the branchTips value of the last day
        csvRec.branchTips = commitSummary.branchTips.length;
        //
        previousCommitSummaryDate = commitSummary.day;
    });
    const allCommitWeeklySummariesCsvRecords = Object.values(weeklySummaryDict).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
    return (0, to_csv_1.toCsv)(allCommitWeeklySummariesCsvRecords);
}
function addConsiderationsForBranchesReport(r) {
    (0, report_1.addConsiderationsHeader)(r);
    (0, report_1.addConsideration)(r, `Weekly summary for branches saved in ${r.weeklyCsvFile.val}.`);
    (0, report_1.addConsideration)(r, `The total number of merges has been ${r.totMerges.val}.`);
    (0, report_1.addConsideration)(r, `The average number of lines added or deleted in a merge is ${r.averageLinesAddDelForMerge.val}.`);
    (0, report_1.addConsideration)(r, `The max number of commits in a day has been ${r.maxCommits.val}.`);
    (0, report_1.addConsideration)(r, `The max number of merges in a day has been ${r.maxMerges.val}.`);
    (0, report_1.addConsideration)(r, `The max number of brach tips in a day, e.g. commits with no children up to that day, has been ${r.maxBranchTips.val}.`);
    (0, report_1.addConsideration)(r, `Currently there are ${r.branchTips.val.length} brach tips, e.g. commits with no children.`);
    return r;
}
exports.addConsiderationsForBranchesReport = addConsiderationsForBranchesReport;
//# sourceMappingURL=branches-report.js.map