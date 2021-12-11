import { pipe, Observable, forkJoin } from 'rxjs';
import { map, toArray, tap, concatMap, share } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { addConsideration, addConsiderationsHeader, Report, ReportParams, topChurnContributors } from './report';
import { REPORT_CONFIG } from './config/report-config';
import { addProjectInfo } from './add-project-info';

import { toCsvObs } from '../0-tools/csv/to-csv';

import { AuthorChurn } from '../1-C-aggregate-types/author-churn';
import { ProjectInfo } from '../1-C-aggregate-types/project-info';

export type AuthorChurnReportParams = {
    // size of the list of authors to be considered as top contributors in terms of churn
    numberOfTopChurnAuthors?: number;
    // percentage limit, e.g. how many authors contribute to this percentage of churn
    percentThreshold?: number;
} & ReportParams;

export const AUTHOR_CHURN_REPORT_NAME = 'AuthorChurnReport';
export class AuthorChurnReport extends Report {
    numAuthors = { val: 0, description: `Number of authors who have contributed to the churn authoring some files` };
    totChurn = {
        val: 0,
        description: `Total number of lines added or deleted in the files selected for the period chosen`,
    };
    topAuthors = { val: [] as AuthorChurn[], description: `Authors who hove contributed most to the churn` };
    topAuthorChurnContributors = {
        val: [] as AuthorChurn[],
        description: `Authors who contribute to reach a certain percantage threshold`,
    };
    constructor(_params: AuthorChurnReportParams) {
        super(_params);
        this.name = AUTHOR_CHURN_REPORT_NAME;
        this.description = `Author churn report`;
    }
    addConsiderations() {
        return addConsiderationsForAuthorChurnReport(this);
    }
}

// API to be used if we want to generate the report for the general project as well as the report about author churn
// reads also from the repo folder for information about the files currently in the project
export function projectAndAuthorChurnReport(
    authorChurns: Observable<AuthorChurn[]>,
    projectInfo: Observable<ProjectInfo>,
    params: AuthorChurnReportParams,
    csvFilePath?: string,
) {
    return projectInfo.pipe(concatMap((prjInfo) => authorChurnReport(authorChurns, params, prjInfo, csvFilePath)));
}

// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
export function authorChurnReport(
    authorChurns: Observable<AuthorChurn[]>,
    params: AuthorChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return authorChurnReportCore(authorChurns, params, csvFilePath).pipe(
        tap((report: AuthorChurnReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => addConsiderationsForAuthorChurnReport(report)),
    );
}

// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of AuthorChurn objects, like when we create the report from a Mongo query
export function authorChurnReportCore(
    authorChurns: Observable<AuthorChurn[]>,
    params: AuthorChurnReportParams,
    csvFilePath?: string,
) {
    const authorChurnsSource = authorChurns.pipe(share());
    const generateReport = authorChurnsSource.pipe(
        tap((authorChurns) => {
            console.log(`Processing ${authorChurns.length} records to generate AuthorChurnReport`);
        }),
        _authorChurnReport(params),
        tap((report) => (report.csvFile.val = csvFilePath)),
    );
    const concurrentStreams: [Observable<AuthorChurnReport>, Observable<string>?] = [
        generateReport as Observable<AuthorChurnReport>,
    ];
    if (csvFilePath) {
        const writeCsv = authorChurnsSource.pipe(
            mapToCsvAndWriteAuthorChurn(csvFilePath),
            map(() => csvFilePath),
        );
        concurrentStreams.push(writeCsv);
    }
    return forkJoin(concurrentStreams).pipe(
        tap({
            next: ([, csvFile]) => console.log(`====>>>> AUTHOR CHURN REPORT GENERATED -- data saved in ${csvFile}`),
        }),
        map(([report]) => report),
    );
}

function _authorChurnReport(params: AuthorChurnReportParams) {
    return pipe(
        map((authorsInfo: AuthorChurn[]) => {
            const r = authorsInfo.reduce((_r, author: AuthorChurn) => {
                _r.numAuthors.val++;
                _r.totChurn.val = _r.totChurn.val + author.linesAddDel;
                return _r;
            }, new AuthorChurnReport(params));
            // set the default values in the params so that they are correctly reported in the report
            if (params.numberOfTopChurnAuthors === undefined) {
                params.numberOfTopChurnAuthors = REPORT_CONFIG.defaultTopChurnAuthorsListSize;
            }
            if (params.percentThreshold === undefined) {
                params.percentThreshold = REPORT_CONFIG.defaultPercentageThreshold;
            }
            r.topAuthors.val = authorsInfo.slice(0, params.numberOfTopChurnAuthors);
            r.topAuthorChurnContributors.val = topChurnContributors<AuthorChurn>(
                authorsInfo,
                params.percentThreshold,
                r.totChurn.val,
            );
            return r;
        }),
    );
}

export function mapToCsvAndWriteAuthorChurn(csvFilePath: string) {
    return pipe(
        mapAuthorsChurnToCsv(),
        toArray(),
        concatMap((lines) => writeFileObs(csvFilePath, lines)),
        tap({
            next: (csvFile) => console.log(`====>>>> csv file for files-churn ${csvFile} created`),
        }),
    );
}

function mapAuthorsChurnToCsv() {
    return pipe(
        concatMap((authorChurns: AuthorChurn[]) => {
            return authorChurns.map((author) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const _author: any = { ...author };
                _author.firstCommit = _author.firstCommit.toISOString();
                _author.lastCommit = _author.lastCommit.toISOString();
                return _author;
            });
        }),
        toCsvObs(),
    );
}

export function addConsiderationsForAuthorChurnReport(r: AuthorChurnReport) {
    addConsiderationsHeader(r);
    addConsideration(r, `-- ${r.numAuthors.val} authors have contributed to the project in the period considered.`);
    addConsideration(
        r,
        `The total churn, measured as total number of lines added or removed in the period considered, is ${r.totChurn.val}.`,
    );
    addConsideration(r, `The authors who have contributed most are ${r.topAuthors.val.map((a) => a.authorName)}.`);
    addConsideration(
        r,
        `-- ${r.topAuthorChurnContributors.val.length} authors who have contributed for more than ${r.params.val['percentThreshold']}% of churn.`,
    );
    return r;
}
