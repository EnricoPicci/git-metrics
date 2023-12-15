import { pipe, Observable, forkJoin } from 'rxjs';
import { map, share, concatMap, tap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { addProjectInfo } from './add-project-info';
import { addConsideration, addConsiderationsHeader, Report, ReportParams } from './report';

import { toCsv } from '@enrico.piccinin/csv-tools';

import { FileCoupling } from '../1-C-aggregate-types/file-coupling';
import { ProjectInfo } from '../1-C-aggregate-types/project-info';

export type FilesCouplingReportParams = {
    // depthInFilesCoupling aims to guide how many files are considered in the report. Here is how it works.
    // The files are sorted for their number of commits.
    // The higher the number of commits, the more work it is associated with the file and therefore its eventual coupling
    // with other files with an high number of commits is an indicator of a potential problem of coupling.
    // For instance, if FileA has 100 commits and FileB has 90 commits and 90% of the times FileB is committed also FileA is committed,
    // then it may mean that FileB and FileA are highly coupled.
    // Files in the coupling report are sorted by the numebr of commits (the more commits the more work has been performed on them).
    // Starting from the file with highest number of commits, the depth finds the lowest number of commits we want to consider.
    // For instance, if the number of commits in descending order is [20, 18, 15, 12, 10, ...] and the depth is 3, then we consider
    // only those files which show a number of commits higher than 15.
    depthInFilesCoupling?: number;
} & ReportParams;

export const FILES_COUPLING_NAME = 'FilesCouplingReport';
export class FilesCouplingReport extends Report {
    maxCouplings = {
        val: [] as FileCoupling[],
        description: `Files whith an high number of commits potentially coupled`,
    };
    constructor(_params: FilesCouplingReportParams) {
        super(_params, FILES_COUPLING_NAME, `File coupling report`);
    }
    addConsiderations() {
        return addConsiderationsForFilesCouplingReport(this);
    }
}

// API to be used if we want to generate the report for the general project as well as the report about file churn
// reads also from the repo folder for information about the files currently in the project
export function projectAndFileCouplingReport(
    fileCoupling: Observable<FileCoupling[]>,
    projectInfo: Observable<ProjectInfo>,
    params: FilesCouplingReportParams,
    csvFilePath = '',
) {
    return projectInfo.pipe(concatMap((prjInfo) => filesCouplingReport(fileCoupling, params, prjInfo, csvFilePath)));
}

// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of GitCommit
export function filesCouplingReport(
    fileCoupling: Observable<FileCoupling[]>,
    params: FilesCouplingReportParams,
    projectInfo: ProjectInfo,
    csvFilePath: string,
) {
    return fileCouplingReportCore(fileCoupling, params, csvFilePath).pipe(
        tap((report) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => addConsiderationsForFilesCouplingReport(report)),
    );
}
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of GitCommit objects, like when we create the report from a Mongo query
export function fileCouplingReportCore(
    fileCoupling: Observable<FileCoupling[]>,
    params: FilesCouplingReportParams,
    csvFilePath = '',
) {
    const fileCouplingSource = fileCoupling.pipe(
        tap((fileCouplings) => {
            console.log(`Processing ${fileCouplings.length} records to generate FileCouplingReport`);
        }),
        share(),
    );
    const generateReport = fileCouplingSource.pipe(
        _fileCouplingReport(params),
        tap((report) => (report.csvFile.val = csvFilePath)),
    );
    const concurrentStreams: Observable<any>[] = [generateReport as Observable<FilesCouplingReport>];
    if (csvFilePath) {
        concurrentStreams.push(fileCouplingSource);
        return forkJoin(concurrentStreams).pipe(
            concatMap(([report, _allFileCouplings]) => {
                const allFileCouplings = _allFileCouplings!;
                report.csvFile.val = csvFilePath;
                if (allFileCouplings.length === 0) {
                    console.log('!!!!!!!! no data on file couplings');
                }
                const csvLines = toCsv(allFileCouplings);
                return writeFileObs(csvFilePath, csvLines).pipe(
                    map((csvFile) => [report, csvFile] as [FilesCouplingReport, string]),
                );
            }),
            tap({
                next: ([report, csvFile]) => {
                    console.log(``);
                    console.log(`====>>>> FILES COUPLING REPORT GENERATED -- data saved in ${csvFile}`);
                    report.csvFile.val = csvFile;
                },
            }),
            map(([report]) => report),
        );
    }
    return generateReport.pipe(
        tap({
            next: () => {
                console.log(`====>>>> FILES COUPLING REPORT GENERATED`);
            },
        }),
    );
}

function _fileCouplingReport(params: FilesCouplingReportParams) {
    return pipe(
        map((listOfCouplings: FileCoupling[]) => {
            const report = new FilesCouplingReport(params);
            report.maxCouplings.val = listOfCouplings.slice(0, 5);
            return report;
        }),
    );
}

export function addConsiderationsForFilesCouplingReport(r: FilesCouplingReport) {
    addConsiderationsHeader(r);
    const mostCoupledFile = r.maxCouplings.val.length > 0 ? r.maxCouplings.val[0] : null;
    if (mostCoupledFile) {
        const howManyTimesPercentage = mostCoupledFile.howManyTimes_vs_totCommits;
        const coupledWith = mostCoupledFile.path;
        addConsideration(
            r,
            `It seems that ${howManyTimesPercentage}% of the times file ${mostCoupledFile.coupledFile} is committed also file ${coupledWith} is committed.`,
        );
    }
    if (r.csvFile.val) {
        addConsideration(r, `The files coupling info have been saved in the file ${r.csvFile.val}.`);
    }
    return r;
}
