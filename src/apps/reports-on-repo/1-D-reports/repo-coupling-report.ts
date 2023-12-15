import { pipe, Observable } from 'rxjs';
import { map, concatMap, mergeMap, toArray, tap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { REPORT_CONFIG } from './config/report-config';
import { Report, ReportParams } from './report';

import { toCsvObs } from '@enrico.piccinin/csv-tools';
import { TUPLE_KEY_SEPARATOR } from '../../../tools/dictionary-utils/dictionary-utils';

import { FileTuplesDict } from '../1-C-aggregate-types/file-tuples';

export type RepoCouplingReportParams = {
    repoFolderPaths: string[];
    timeWindowLengthInDays?: number;
} & ReportParams;

export const REPO_COUPLING_REPORT_NAME = 'AuthorChurnReport';
export class RepoCouplingReport extends Report {
    constructor(_params: RepoCouplingReportParams) {
        super(_params, REPO_COUPLING_REPORT_NAME, `Repo coupling report`);
        if (_params.timeWindowLengthInDays === undefined) {
            _params.timeWindowLengthInDays = REPORT_CONFIG.timeWindowLengthInDays;
        }
    }
}

export function repoCouplingReport(fileTuplesDict: Observable<FileTuplesDict>, csvFilePath: string) {
    return fileTuplesDict.pipe(
        flatFilesCsv(),
        toArray(),
        concatMap((lines) => {
            return writeFileObs(csvFilePath, lines);
        }),
        tap({
            complete: () => {
                console.log(`====>>>> REPO COUPLING REPORT GENERATED -- data saved in ${csvFilePath}`);
            },
        }),
    );
}

// FileCsv holds, per each file committed during the analysis period, the number of times the file has been committed IN TH SAME TIME WINDOW together
// with other files coming from other the other repos under analysis.
// FileCsv also contains other data relative to the file gathered from the git log and the cloc analysis
type FileCsv = {
    repoIndex: number;
    file: string;
    // howManyTimes is the number of times the file has been committed in the same timewindow together with the other files of the tuple
    howManyTimes: number;
    //
    // togetherWith_x  is a seried of properties we add to the object in the logic of the method
    //
    // occurrenciesInTimewindos is the number of timewindows where the file has been committed at least once, regardless of the presence of commits of the
    // other files of the tuple in the same timewindow
    occurrenciesInTimeWindows: number;
    //
    // tupleFileOccurrenciesInTimeWindowsRatio is the result of howManyTimes / occurrenciesInTimeWindows and provide an hypothesis on the level of
    // coupling between this file and the other files in the tuple
    tupleFileOccurrenciesInTimeWindowsRatio: number;
    //
    // totNumberOfCommits is the number of commits in the period independent from the concept of timewindow
    totNumberOfCommits: number;
    // totNumberOfTimeWindowsWithCommits is the number of timewindos with at least one commit
    totNumberOfTimeWindowsWithCommits: number;
    //
    cloc: number;
    linesAdded: number;
    linesDeleted: number;
    commitIds?: string;
};
export function flatFilesCsv() {
    // file, howManyTimes, togetherWith_1, togetherWith_2, togetherWith_N, occurrenciesInTimewindos, tupleFileOccurrenciesInTimewindowwRatio, totNumberOfCommits,
    return pipe(
        map((fileTuples: FileTuplesDict) => {
            return Object.entries(fileTuples).reduce(
                (flatFileTuples, [fileTupleId, { tupleOccurrenciesInTimeWindow, files }]) => {
                    const fileTuples = Object.values(files).map((f) => {
                        const ft = {
                            repoIndex: f.repoIndex,
                            file: f.path,
                            howManyTimes: tupleOccurrenciesInTimeWindow,
                        } as FileCsv;
                        // add the other files of the tuple as properties
                        fileTupleId.split(TUPLE_KEY_SEPARATOR).forEach((fileInTuple, i) => {
                            if (fileInTuple !== f.path) {
                                (ft as any)[`togetherWith_${i}`] = fileInTuple;
                            }
                        });
                        ft.occurrenciesInTimeWindows = f.fileOccurrenciesInTimeWindows || 0;
                        ft.tupleFileOccurrenciesInTimeWindowsRatio = f.tupleFileOccurrenciesRatio || 0;
                        ft.totNumberOfCommits = f.totCommits || 0;
                        ft.totNumberOfTimeWindowsWithCommits = f.totalNumberOfTimeWindowsWithCommits || 0;
                        //
                        ft.cloc = f.cloc;
                        ft.linesAdded = f.linesAdded;
                        ft.linesDeleted = f.linesDeleted;
                        // transform the array of commits into a string so that all info about the commits are stored in one string field which is handy for csv
                        ft.commitIds = f.commits?.join('-') || '';
                        return ft;
                    });
                    const _flatFileTuples = [...flatFileTuples, ...fileTuples];
                    return _flatFileTuples;
                },
                [] as FileCsv[],
            );
        }),
        // mergeMap transform the array into a stream of objects
        mergeMap((flatFiles) => flatFiles),
        toCsvObs(),
    );
}
