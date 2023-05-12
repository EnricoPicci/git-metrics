import { pipe, Observable, forkJoin, of } from 'rxjs';
import { map, share, tap, concatMap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { addProjectInfo } from './add-project-info';
import { REPORT_CONFIG } from './config/report-config';
import {
    addConsideration,
    addConsiderationsHeader,
    filterMessage,
    Report,
    ReportParams,
    topChurnContributors,
} from './report';

import { toCsv } from '../0-tools/csv/to-csv';

import { FileChurn } from '../1-C-aggregate-types/file-churn';
import { ProjectInfo } from '../1-C-aggregate-types/project-info';

export type FileChurnReportParams = {
    topChurnFilesSize?: number;
    percentThreshold?: number;
} & ReportParams;

export const FILE_CHURN_REPORT_NAME = 'FileChurnReport';
export class FileChurnReport extends Report {
    numFiles = { val: 0, description: `Number of files with churn` };
    clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
    totChurn = {
        val: 0,
        description: `Total number of lines added or deleted in the files selected for the period chosen`,
    };
    churn_vs_cloc = { val: 0, description: `Churn versus cloc` };
    topChurnedFiles = { val: [] as FileChurn[], description: `Files that show the highest churn` };
    topChurnContributors = {
        val: [] as FileChurn[],
        description: `Files that contribute to reach a certain percantage threshold`,
    };
    topChurnContributorsAge = {
        val: {} as { [key: string]: FileChurn[] },
        description: `Age distribution of files which contribute to the churn up to a certain threshold`,
    };
    constructor(_params: FileChurnReportParams) {
        super(_params);
        this.name = FILE_CHURN_REPORT_NAME;
        this.description = `File churn report`;
    }
    addConsiderations() {
        return addConsiderationsForFileChurnReport(this);
    }
}

// API to be used if we want to generate the report for the general project as well as the report about file churn
// reads also from the repo folder for information about the files currently in the project
export function projectAndFileChurnReport(
    fileChurns: Observable<FileChurn[]>,
    projectInfo: Observable<ProjectInfo>,
    params: FileChurnReportParams,
    csvFilePath?: string,
) {
    return projectInfo.pipe(concatMap((prjInfo) => fileChurnReport(fileChurns, params, prjInfo, csvFilePath)));
}

// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
export function fileChurnReport(
    fileChurns: Observable<FileChurn[]>,
    params: FileChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return fileChurnReportCore(fileChurns, params, csvFilePath).pipe(
        tap((report: FileChurnReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => addConsiderationsForFileChurnReport(report)),
    );
}

// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of FileChurn objects, like when we create the report from a Mongo query
export function fileChurnReportCore(
    fileChurns: Observable<FileChurn[]>,
    params: FileChurnReportParams,
    csvFilePath?: string,
): Observable<FileChurnReport> {
    const fileChurnSource = fileChurns.pipe(
        tap((fileChurns) => {
            console.log(`Processing ${fileChurns.length} records to generate FileChurnReport`);
        }),
        share(),
    );
    const generateReport = fileChurnSource.pipe(
        _fileChurnReport(params),
        tap((report) => (report.csvFile.val = csvFilePath)),
    );
    const concurrentStreams: [Observable<FileChurnReport>, Observable<FileChurn[]>?] = [
        generateReport as Observable<FileChurnReport>,
    ];

    if (csvFilePath) {
        const allChurns = fileChurnSource;
        concurrentStreams.push(allChurns);
        return forkJoin(concurrentStreams).pipe(
            concatMap(([report, allFileChurns]) => {
                if (allFileChurns.length === 0) {
                    return of([report, null]);
                }
                report.csvFile.val = csvFilePath;
                const csvLines = mapFileChurnToCsv(allFileChurns, report);
                return writeFileObs(csvFilePath, csvLines).pipe(
                    map((csvFile) => [report, csvFile] as [FileChurnReport, string]),
                );
            }),
            tap({
                next: ([, csvFile]) => {
                    if (!csvFile) {
                        console.log(
                            `====>>>> NO FILE CHURN DATA FOUND for folder ${params.repoFolderPath} and filter ${params.filter} -- no csv file created`,
                        );
                        return;
                    }
                    console.log(`====>>>> FILE CHURN REPORT GENERATED -- data saved in ${csvFile}`);
                },
            }),
            map(([report]) => report),
        );
    }
    return generateReport.pipe(
        tap({
            next: () => {
                console.log(`====>>>> FILE CHURN REPORT GENERATED`);
            },
        }),
    );
}

function _fileChurnReport(params: FileChurnReportParams) {
    return pipe(
        map((filesInfo: FileChurn[]) => {
            const r = filesInfo.reduce((_r, file: FileChurn) => {
                _r.clocTot.val = _r.clocTot.val + file.cloc;
                _r.numFiles.val++;
                _r.totChurn.val = _r.totChurn.val + file.linesAddDel;
                return _r;
            }, new FileChurnReport(params));
            // set the default values in the params so that they are correctly reported in the report
            if (params.topChurnFilesSize === undefined) {
                params.topChurnFilesSize = REPORT_CONFIG.defaultTopChurnFilesListSize;
            }
            if (params.percentThreshold === undefined) {
                params.percentThreshold = REPORT_CONFIG.defaultPercentageThreshold;
            }
            r.churn_vs_cloc.val = r.totChurn.val / r.clocTot.val;
            r.topChurnedFiles.val = filesInfo.slice(0, params.topChurnFilesSize);
            r.topChurnContributors.val = topChurnContributors<FileChurn>(
                filesInfo,
                params.percentThreshold,
                r.totChurn.val,
            );
            r.topChurnContributorsAge.val = topChurnContributorsAge(r.topChurnContributors.val);
            return r;
        }),
    );
}

export function mapFileChurnToCsv(fileChurns: FileChurn[], report: FileChurnReport) {
    let cumulativeChurnPercentAccumulator = 0;
    let cumulativeNumberOfFilesPercentAccumulator = 0;
    const enrichedFileChurns = fileChurns.map((fileChurn, i) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _file: any = { ...fileChurn };
        _file.created = fileChurn.created.toISOString();
        cumulativeChurnPercentAccumulator =
            cumulativeChurnPercentAccumulator + (fileChurn.linesAddDel / report.totChurn.val) * 100;
        _file.cumulativeChurnPercent = cumulativeChurnPercentAccumulator;
        cumulativeNumberOfFilesPercentAccumulator =
            cumulativeNumberOfFilesPercentAccumulator + (1 / report.numFiles.val) * 100;
        _file.cumulativeNumberOfFilesPercent = cumulativeNumberOfFilesPercentAccumulator;
        _file.churnRanking = i + 1;
        return _file;
    });
    return toCsv(enrichedFileChurns);
}

export function addConsiderationsForFileChurnReport(r: FileChurnReport) {
    addConsiderationsHeader(r);
    addConsideration(r, `${r.numFiles.val} files have been changed in the period considered.`);
    addConsideration(
        r,
        `The files which have been changed in the period currently contain ${
            r.clocTot.val
        } lines in the project folder ${filterMessage(r.params.val.filter)}.`,
    );
    addConsideration(
        r,
        `The total churn, measured as total number of lines added or removed in the period considered, is ${r.totChurn.val}.`,
    );
    addConsideration(
        r,
        `The total churn in the period considered (${r.totChurn.val}) is ${r.churn_vs_cloc.val.toFixed(
            2,
        )} times the current number of lines of code (${r.clocTot.val}).`,
    );
    addConsideration(
        r,
        `${((r.topChurnContributors.val.length / r.numFiles.val) * 100).toFixed(2)}% of files contribute to ${
            r.params.val['percentThreshold']
        }% of churn`,
    );
    addConsideration(
        r,
        `The age of the files that contribute most to the churn is [ ${topChurnContributorsAgeToString(
            r.topChurnContributorsAge.val,
        )} ]`,
    );
    return r;
}

// calculate the age of the files that contribute to reach a certain threshold of churn
export function topChurnContributorsAge(topContributors: FileChurn[]) {
    return topContributors.reduce((acc, val) => {
        const year = val.created.getFullYear().toString();
        acc[year] = acc[year] ? [...acc[year], val] : [val];
        return acc;
    }, {} as { [key: string]: FileChurn[] });
}
export function topChurnContributorsAgeToString(topContributors: { [key: string]: FileChurn[] }) {
    return Object.entries(topContributors).reduce((acc, val) => {
        acc = `${acc}${val[0]}: ${Object.keys(val[1]).length} -- `;
        return acc;
    }, '');
}
