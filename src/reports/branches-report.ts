import { pipe, Observable, forkJoin } from 'rxjs';
import { map, share, tap, concatMap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { toCsv } from '../tools/csv/to-csv';

import { addProjectInfo } from './add-project-info';
import { addConsideration, addConsiderationsHeader, Report, ReportParams } from './report';

import { ProjectInfo } from '../aggregate-types/project-info';
import { CommitDaylySummary } from '../aggregate-types/commit-dayly-summary';
import { DaylySummaryDictionary } from '../aggregate-in-memory/commit-branch-tips-aggregate';
import { dayToWeekDictionary } from '../tools/dates/date-functions';

export type BranchesReportParams = {
    //
} & ReportParams;

export const BRANCHES_REPORT_NAME = 'BranchesReport';
export class BranchesReport extends Report {
    maxCommits = { val: 0, description: `Maximum number of commits in a day.` };
    maxMerges = { val: 0, description: `Maximum number of commits merged in a day.` };
    branchTips = {
        val: [],
        description: `Commits with no children which therefore represents  a proxy of the tips of the branches in the repo. This is a proxy since 
also staches are commits that do not have children but are not really branches. It is also possible to check out an old commit and produce some changes and
a new commit without actually attaching to this commit a branch name. In any case the normal case is to have a branch created out of a commit and this is why this
list is a good approximation of all the branches open in the repo as of now.`,
    };
    maxBranchTips = { val: 0, description: `Maximum number of branch tips availbale at the end of a day.` };
    weeklyCsvFile = { val: '', description: `File where the weekly evolution of commits and branches is registerer.` };
    //
    constructor(_params: BranchesReportParams) {
        super(_params);
        this.name = BRANCHES_REPORT_NAME;
        this.description = `Report on the evolution of branches over time`;
    }
}

// API to be used if we want to generate the report for the general project as well as the report about branches
// reads also from the repo folder for information about the files currently in the project
export function projectAndBranchesReport(
    commitDaylySummary: Observable<DaylySummaryDictionary>,
    projectInfo: Observable<ProjectInfo>,
    params: BranchesReportParams,
    csvFilePath?: string,
    weeklyCsvFilePath?: string,
) {
    return projectInfo.pipe(
        concatMap((prjInfo) => branchesReport(commitDaylySummary, params, prjInfo, csvFilePath, weeklyCsvFilePath)),
    );
}

// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of CommitDaylySummary objects
export function branchesReport(
    commitDaylySummary: Observable<DaylySummaryDictionary>,
    params: BranchesReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
    weeklyCsvFilePath?: string,
) {
    return branchesReportCore(commitDaylySummary, params, csvFilePath, weeklyCsvFilePath).pipe(
        tap((report: BranchesReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => addConsiderationsForBranchesReport(report)),
    );
}

// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of CommitDaylySummary objects, like when we create the report from a Mongo query
export function branchesReportCore(
    commitDaylySummary: Observable<DaylySummaryDictionary>,
    params: BranchesReportParams,
    csvFilePath?: string,
    weeklyCsvFilePath?: string,
): Observable<BranchesReport> {
    const commitDaylySummarySource = commitDaylySummary.pipe(
        map((daylySummaryDictionary) => {
            // sort dayly summaries from the eldest, which has the smallest time, to the newer =, which has the biggest time
            const daylyCommitSummariesSorted = Object.values(daylySummaryDictionary).sort(
                (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime(),
            );
            return daylyCommitSummariesSorted;
        }),
        tap((commitDaylySummaries) => {
            console.log(`Processing ${commitDaylySummaries.length} records to generate BranchesReport`);
        }),
        share(),
    );
    const generateReport = commitDaylySummarySource.pipe(_branchesReport(params));
    const concurrentStreams: [Observable<BranchesReport>, Observable<CommitDaylySummary[]>?] = [
        generateReport as Observable<BranchesReport>,
    ];

    if (csvFilePath) {
        if (!weeklyCsvFilePath) {
            throw new Error('weeklyCsvFilePath has to be specified');
        }
        const allDaylySummary = commitDaylySummarySource;
        concurrentStreams.push(allDaylySummary);
        return forkJoin(concurrentStreams).pipe(
            concatMap(([report, allCommitDaylySummaries]) => {
                report.csvFile.val = csvFilePath;
                report.weeklyCsvFile.val = weeklyCsvFilePath;
                const csvLines = mapDaylySummariesToCsv(allCommitDaylySummaries);
                const weeklyCsvLines = weeklySummariesToCsv(allCommitDaylySummaries);
                return forkJoin([
                    writeFileObs(csvFilePath, csvLines),
                    writeFileObs(weeklyCsvFilePath, weeklyCsvLines),
                ]).pipe(
                    map(
                        ([csvFile, weeklyCsvFile]) =>
                            [report, csvFile, weeklyCsvFile] as [BranchesReport, string, string],
                    ),
                );
            }),
            tap({
                next: ([, csvFile, weeklyCsvFile]) => {
                    console.log(`====>>>> BRANCH REPORT GENERATED -- data saved in ${csvFile}`);
                    console.log(`====>>>> BRANCH WEEKLY REPORT GENERATED -- data saved in ${weeklyCsvFile}`);
                },
            }),
            map(([report]) => report),
        );
    }
    return generateReport.pipe(
        tap({
            next: () => {
                console.log(`====>>>> BRANCH REPORT GENERATED`);
            },
        }),
    );
}

function _branchesReport(params: BranchesReportParams) {
    return pipe(
        map((daylyCommitSummariesSorted: CommitDaylySummary[]) => {
            const r = new BranchesReport(params);
            let maxCommits = 0;
            let maxMerges = 0;
            let maxBranchTips = 0;
            daylyCommitSummariesSorted.forEach((daylyCommitSummary) => {
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
            r.maxCommits.val = maxCommits;
            r.maxMerges.val = maxMerges;
            r.maxBranchTips.val = maxBranchTips;
            r.branchTips.val = daylyCommitSummariesSorted[daylyCommitSummariesSorted.length - 1].branchTips;
            return r;
        }),
    );
}

type BranchReportCsvType = {
    day: string;
    numberOfCommits: number;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    branchTips: number;
    deltaBranchTips: number;
    numberOfCommitsMergedInTheDay: number;
    numberOfCommitsWithNoFutureChildren: number;
    numberOfBranchTipsWhichWillHaveChildren: number;
    commitsWithNoFutureChildren: string[];
};
type BranchReportWeeklyCsvType = {
    weekStart: string;
    numberOfCommits: number;
    linesAdded: number;
    linesDeleted: number;
    linesAddDel: number;
    // branch tips at the end of the week
    branchTips: number;
    numberOfCommitsMergedInTheWeek: number;
    numberOfCommitsWithNoFutureChildren: number;
};
function mapDaylySummariesToCsv(allCommitDaylySummaries: CommitDaylySummary[]) {
    const allCommitDaylySummariesCsvRecords = allCommitDaylySummaries.map((commitSummary) => {
        const csvRec: BranchReportCsvType = {
            day: commitSummary.day,
            numberOfCommits: commitSummary.numberOfCommits,
            linesAdded: commitSummary.linesAdded,
            linesDeleted: commitSummary.linesDeleted,
            linesAddDel: commitSummary.linesAddDel,
            branchTips: commitSummary.branchTips.length,
            deltaBranchTips: commitSummary.deltaBranchTips,
            numberOfCommitsMergedInTheDay: commitSummary.numberOfCommitsMergedInTheDay,
            numberOfCommitsWithNoFutureChildren: commitSummary.numberOfCommitsWithNoFutureChildren,
            numberOfBranchTipsWhichWillHaveChildren: commitSummary.numberOfBranchTipsWhichWillHaveChildren,
            commitsWithNoFutureChildren: commitSummary.commitsWithNoFutureChildren,
        };
        return csvRec;
    });
    return toCsv(allCommitDaylySummariesCsvRecords);
}
function weeklySummariesToCsv(allCommitDaylySummaries: CommitDaylySummary[]) {
    const firstDay = allCommitDaylySummaries[0].day;
    const lastDay = allCommitDaylySummaries[allCommitDaylySummaries.length - 1].day;
    const daysWeeksDict = dayToWeekDictionary(new Date(firstDay), new Date(lastDay));

    const weeklySummaryDict: { [weekStart: string]: BranchReportWeeklyCsvType } = {};

    let csvRec: BranchReportWeeklyCsvType;
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
    const allCommitWeeklySummariesCsvRecords = Object.values(weeklySummaryDict).sort(
        (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
    );
    return toCsv(allCommitWeeklySummariesCsvRecords);
}

export function addConsiderationsForBranchesReport(r: BranchesReport) {
    addConsiderationsHeader(r);
    addConsideration(r, `Weekly summary for branches saves in ${r.weeklyCsvFile.val}.`);
    addConsideration(r, `The max number of commits in a day has been ${r.maxCommits.val}.`);
    addConsideration(r, `The max number of merges in a day has been ${r.maxMerges.val}.`);
    addConsideration(
        r,
        `The max number of brach tips in a day, e.g. commits with no children up to that day, has been ${r.maxBranchTips.val}.`,
    );
    addConsideration(r, `Currently there are ${r.branchTips.val.length} brach tips, e.g. commits with no children.`);
    return r;
}
