import { pipe, Observable, forkJoin } from 'rxjs';
import { map, share, toArray, tap, concatMap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { addProjectInfo } from './add-project-info';
import { REPORT_CONFIG } from './config/report-config';
import { addConsideration, addConsiderationsHeader, Report, ReportParams } from './report';

import { toCsvObs } from '../../../tools/csv/to-csv';

import { FileAuthors } from '../1-C-aggregate-types/file-authors';
import { ProjectInfo } from '../1-C-aggregate-types/project-info';

export type FileAuthorsReportParams = {
    minNumberOfAuthorsThreshold?: number;
    maxNumberOfAuthorsThreshold?: number;
} & ReportParams;

export const FILE_AUTHORS_REPORT_NAME = 'FileAuthorsReport';
export class FileAuthorsReport extends Report {
    clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
    fewAutorsFiles = {
        val: [] as FileAuthors[],
        description: `Files that have less or equal the number of authors set as minimun threshold in the report parameters`,
    };
    manyAutorsFiles = {
        val: [] as FileAuthors[],
        description: `Files that have more or equal the number of authors set as maximum threshold in the report parameters`,
    };

    constructor(_params: FileAuthorsReportParams) {
        super(_params, FILE_AUTHORS_REPORT_NAME, `File-Authors report`);
    }
    addConsiderations() {
        return addConsiderationsForFileAuthorsReport(this);
    }
}

// API to be used if we want to generate the report for the general project as well as the report about file-authors
// reads also from the repo folder for information about the files currently in the project
export function projectAndFileAuthorsReport(
    fileAuthors: Observable<FileAuthors[]>,
    projectInfo: Observable<ProjectInfo>,
    params: FileAuthorsReportParams,
    csvFilePath?: string,
) {
    return projectInfo.pipe(concatMap((prjInfo) => fileAuthorsReport(fileAuthors, params, prjInfo, csvFilePath)));
}
// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of FileGitCommit
export function fileAuthorsReport(
    fileCommits: Observable<FileAuthors[]>,
    params: FileAuthorsReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return fileAuthorsReportCore(fileCommits, params, csvFilePath).pipe(
        tap((report: FileAuthorsReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => addConsiderationsForFileAuthorsReport(report)),
    );
}
// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of FileAuthors objects, like when we create the report from a Mongo query
export function fileAuthorsReportCore(
    fileAuthor: Observable<FileAuthors[]>,
    params: FileAuthorsReportParams,
    csvFilePath = '',
) {
    const fileAuthorSource = fileAuthor.pipe(share());
    const generateReport = fileAuthorSource.pipe(
        tap((fileAuthors) => {
            console.log(`Processing ${fileAuthors.length} records to generate FileAuthorsReport`);
        }),
        _fileAuthorsReport(params),
        tap((report) => (report.csvFile.val = csvFilePath)),
    );
    const concurrentStreams: Observable<any>[] = [generateReport as Observable<FileAuthorsReport>];
    if (csvFilePath) {
        const writeCsv = fileAuthorSource.pipe(
            mapToCsvAndWriteFileAuthor(csvFilePath),
            map(() => csvFilePath),
        );
        concurrentStreams.push(writeCsv);
    }
    return forkJoin(concurrentStreams).pipe(
        tap({
            next: ([, csvFile]) => console.log(`====>>>> FILE AUTHOR REPORT GENERATED -- data saved in ${csvFile}`),
        }),
        map(([report]) => report),
    );
}

function _fileAuthorsReport(params: FileAuthorsReportParams) {
    return pipe(
        map((filesAuthorsInfo: FileAuthors[]) => {
            const r = new FileAuthorsReport(params);
            // set the default values in the params so that they are correctly reported in the report
            if (params.minNumberOfAuthorsThreshold === undefined) {
                params.minNumberOfAuthorsThreshold = REPORT_CONFIG.minNumberOfAuthorsThreshold;
            }
            if (params.maxNumberOfAuthorsThreshold === undefined) {
                params.maxNumberOfAuthorsThreshold = REPORT_CONFIG.maxNumberOfAuthorsThreshold;
            }
            const _minThr = params.minNumberOfAuthorsThreshold;
            const _maxThr = params.maxNumberOfAuthorsThreshold;
            const [fewAuthorsFiles, manyAuthorsFiles, clocTot] = filesAuthorsInfo.reduce(
                ([_min, _max, _clocTot], file: FileAuthors) => {
                    _clocTot = _clocTot + file.cloc;
                    if (file.authors <= _minThr) {
                        _min.push(file);
                    }
                    if (file.authors > _maxThr) {
                        _max.push(file);
                    }
                    return [_min, _max, _clocTot];
                },
                [[], [], 0] as [_min: FileAuthors[], _max: FileAuthors[], _clocTot: number],
            );
            r.clocTot.val = clocTot;
            r.fewAutorsFiles.val = fewAuthorsFiles;
            r.manyAutorsFiles.val = manyAuthorsFiles;
            return r;
        }),
    );
}

export function mapToCsvAndWriteFileAuthor(csvFilePath: string) {
    return pipe(
        mapFileAuthorToCsv(),
        toArray(),
        concatMap((lines) => writeFileObs(csvFilePath, lines)),
        tap({
            next: (csvFile) => console.log(`====>>>> csv file for files-churn ${csvFile} created`),
        }),
    );
}

function mapFileAuthorToCsv() {
    return pipe(
        concatMap((fileAuthors: FileAuthors[]) => {
            return fileAuthors.map((fileAuthor) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const _fileAuthor: any = { ...fileAuthor };
                _fileAuthor.created = fileAuthor.created.toISOString();
                return _fileAuthor;
            });
        }),
        toCsvObs(),
    );
}

export function addConsiderationsForFileAuthorsReport(r: FileAuthorsReport) {
    addConsiderationsHeader(r);
    const fewAuthorsLoc = r.fewAutorsFiles.val.reduce((lines, file) => {
        lines = lines + file.cloc;
        return lines;
    }, 0);
    addConsideration(
        r,
        `${r.fewAutorsFiles.val.filter((f) => f.cloc).length} files (${fewAuthorsLoc} lines) have less than ${
            (r.params.val as any)['minNumberOfAuthorsThreshold']
        } authors in the period considered. This is equal to ${((fewAuthorsLoc / r.clocTot.val) * 100).toFixed(
            2,
        )}% of the total lines in the project files which have changed in the period (${r.clocTot.val})`,
    );
    const manyAuthorsLoc = r.manyAutorsFiles.val.reduce((lines, file) => {
        lines = lines + file.cloc;
        return lines;
    }, 0);
    addConsideration(
        r,
        `${r.manyAutorsFiles.val.filter((f) => f.cloc).length} files (${manyAuthorsLoc} lines) have more than ${
            (r.params.val as any)['maxNumberOfAuthorsThreshold']
        } authors in the period considered. This is equal to ${((manyAuthorsLoc / r.clocTot.val) * 100).toFixed(
            2,
        )}% of the total lines in the project files which have changed in the period (${r.clocTot.val})`,
    );
    return r;
}
