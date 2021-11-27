import { pipe, Observable, forkJoin, of } from 'rxjs';
import { reduce, map, concatMap, mergeMap, toArray, tap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { REPORT_CONFIG } from './config/report-config';
import { Report, ReportParams } from './report';
import { allTuples, keysInAll, TUPLE_KEY_SEPARATOR } from './dictionary-utils/dictionary-utils';

import { toCsvObs } from '../tools/csv/to-csv';
import { FileGitCommitEnriched } from '../git-enriched-types/git-types';

export type RepoCouplingReportParams = {
    repoFolderPaths: string[];
    timeWindowLengthInDays?: number;
} & ReportParams;

export const REPO_COUPLING_REPORT_NAME = 'AuthorChurnReport';
export class RepoCouplingReport extends Report {
    // filesCouplingInfo = {
    //     val: [] as CouplingEntry[],
    //     description: `Files whith an high number of commits potentially coupled`,
    // };
    // filesCouplingCsv: { val?: string; description: string } = {
    //     description: `csv file where the data about the potential couplings is saved`,
    // };
    constructor(_params: RepoCouplingReportParams) {
        super(_params);
        this.name = REPO_COUPLING_REPORT_NAME;
        this.description = `Repo coupling report`;
        if (_params.timeWindowLengthInDays === undefined) {
            _params.timeWindowLengthInDays = REPORT_CONFIG.timeWindowLengthInDays;
        }
    }
}

export function repoCouplingReport_(params: RepoCouplingReportParams, csvFilePath?: string) {
    console.log(params, csvFilePath);
    return null;
    // return pipe(couplingDict(), couplingList(params), buildReport(params));
}

export function repoCouplingReport(
    fileCommitStreams: Observable<FileGitCommitEnriched>[],
    timeWindowLengthInDays: number,
    csvFilePath: string,
) {
    return of(fileCommitStreams).pipe(
        splitCommitsInTimeWindows(timeWindowLengthInDays),
        selectTimeWindowsPresentInAllRepos(),
        calculateFileTuplesPerTimeWindow(),
        groupFileTuples(),
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
        map((fileTuples: FileTuples) => {
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
                                ft[`togetherWith_${i}`] = fileInTuple;
                            }
                        });
                        ft.occurrenciesInTimeWindows = f.fileOccurrenciesInTimeWindows;
                        ft.tupleFileOccurrenciesInTimeWindowsRatio = f.tupleFileOccurrenciesRatio;
                        ft.totNumberOfCommits = f.totCommits;
                        ft.totNumberOfTimeWindowsWithCommits = f.totalNumberOfTimeWindowsWithCommits;
                        //
                        ft.cloc = f.cloc;
                        ft.linesAdded = f.linesAdded;
                        ft.linesDeleted = f.linesDeleted;
                        // transform the array of commits into a string so that all info about the commits are stored in one string field which is handy for csv
                        ft.commitIds = f.commits.join('-');
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

// Returns a dictionary containing the tuples of files which have been committed together in at least one timewindow
// into which the period of analysis has been split.
// For each tuple, returns the number of times the files of the tuple have been committed together and, for each file in the tuple, the cumulated
// number of lines added and deleted in all commits which have happened in the timewindows where they have been committed together.
//
// Ecample
//
// Repo_1 and Repo_2 have 2 time windows where all have committed at least 1 file
//
// Repo_1                                                                           Repo_2
//    - week-3: file_D committed (1 lines added, 1 lines deleted)                   - week-3: file_Q committed (2 lines added, 2 lines deleted)
//              file_A committed (2 lines added, 1 lines deleted)
//    - week-2: file_B committed
//    - week-1: file_A committed (5 lines added, 4 lines deleted)                    - week-1: file_Q committed (2 lines added, 2 lines deleted)
//
// We can see that file_A and file_Q have been committed together in 2 timewindows, while file_D and file_Q have been committed together in 1
// timewindow. On the other hand, file_B of repo_1 has never been committed together with any file of repo_2.
// The result therefore is a dictionary with 2 entries, one for the tuple [file_A, file_Q] and the other for the tuple [file_D, file_Q], like this
// {
//      fileTupleId: 'file_A-file_Q': {
//          howMany: 2,
//          files: {
//              'file_A': {path: 'file_A', cloc: xx, linesAdded: 7, linesDeleted: 5, totCommits: 2},
//              'file_Q': {path: 'file_Q', cloc: yy, linesAdded: 4, linesDeleted: 4, totCommits: 2},
//          }
//      },
//      fileTupleId: 'file_D-file_Q': {
//          howMany: 1,
//          files: {
//              'file_D': {path: 'file_D', cloc: zz, linesAdded: 1, linesDeleted: 1, totCommits: 1},
//              'file_Q': {path: 'file_Q', cloc: yy, linesAdded: 4, linesDeleted: 4, totCommits: 2},
//          }
//      },
// }
//
type FileTuples = {
    [fileTupleId: string]: {
        // how many times we find this file tuple in the selected timewindows
        tupleOccurrenciesInTimeWindow: number;
        files: FilesInfoDictionary;
    };
};
export function groupFileTuples() {
    return pipe(
        map(
            (
                fileTuplesPerTimeWindow: {
                    timeWindowId: string;
                    fileTuples: {
                        [key: string]: FilesInfo[];
                    };
                }[],
            ) => {
                return fileTuplesPerTimeWindow.reduce((fileTuplesDict, fileTuplesPerTimeWindow) => {
                    const fileTuplesForAllTimeWindows = Object.entries(fileTuplesPerTimeWindow.fileTuples);
                    fileTuplesForAllTimeWindows.forEach(([toupleId, filesInTouple]) => {
                        let _touple = fileTuplesDict[toupleId];
                        if (!_touple) {
                            _touple = { tupleOccurrenciesInTimeWindow: 0, files: {} };
                            fileTuplesDict[toupleId] = _touple;
                        }
                        _touple.tupleOccurrenciesInTimeWindow++;
                        filesInTouple.forEach((f) => {
                            let _file = _touple.files[f.path];
                            if (!_file) {
                                _file = {
                                    repoIndex: f.repoIndex,
                                    path: f.path,
                                    cloc: f.cloc,
                                    linesAdded: 0,
                                    linesDeleted: 0,
                                    totCommits: f.totCommits,
                                    commits: [],
                                    totalNumberOfTimeWindowsWithCommits: f.totalNumberOfTimeWindowsWithCommits,
                                    fileOccurrenciesInTimeWindows: f.fileOccurrenciesInTimeWindows,
                                    tupleFileOccurrenciesRatio:
                                        _touple.tupleOccurrenciesInTimeWindow / f.fileOccurrenciesInTimeWindows,
                                };
                                const fileKey = `${f.path}${REPO_INDEX_PATH_SEPARATOR} (repoIndex ;${f.repoIndex})`;
                                _touple.files[fileKey] = _file;
                            }
                            _file.linesAdded = _file.linesAdded + f.linesAdded;
                            _file.linesDeleted = _file.linesDeleted + f.linesDeleted;
                            _file.commits = [..._file.commits, ...f.commits];
                        });
                    });
                    return fileTuplesDict;
                }, {} as FileTuples);
            },
        ),
    );
}

// For each timewindow where all repos have at least one commit, returns all possible combinations of the files committed.
// Expects an array of timewindow data holding the timewindow id as well as the dictionaries containing the files for that timewindow
// one dictionary per repo
//
// Ecample
//
// Repo_1, Repo_2 and Repo_3 have 2 time windows where all have committed at least 1 file
//
// Repo_1                                        Repo_2                                     Repo_2
//    - week-3: file_D committed                    - week-3: file_Q committed                  - week-3: file_X committed
//              file_A committed
//    - week-2: file_B committed
//    - week-1: file_A committed                    - week-1: file_Q committed                  - week-1: file_X committed
//
// The result is an array of objects each containing id of the time window and a dictionary holding the file tuples, like this
// [{
//      timeWindowId: '1234',
//      fileTuples: {
//          'file_C-file_Q-file_X': [file_C, file_Q, file_X],
//          'file_A-file_Q-file_X': [file_A, file_Q, file_X],
//      }
// },
// {
//      timeWindowId: '5678',
//      fileTuples: {
//          'file_A-file_Q-file_X': [file_A, file_Q, file_X],
//      }
// }]
//
// We can see that this dictionary, so built, shows that the files file_A, file_Q and file_X are commiteed together, in the same time window, 2 times.
// This can be used as an indication that maybe there is a coupling among these 3 files, since it may appear from the data that they get often committed
// together
export function calculateFileTuplesPerTimeWindow() {
    return pipe(
        map(
            (
                timeWindows: {
                    key: string;
                    entries: FilesInfoDictionary[];
                }[],
            ) => timeWindows.map((tw) => fileTuplePerTimeWindow(tw)),
        ),
    );
}

// returns the tuples of committed files which are created combining the committed files present in each repo for a specific time window
//
// Example
//
// Repo_1, Repo_2 and Repo_3 have 1 time window where all have committed at least 1 file
//
// Repo_1                                        Repo_2                                     Repo_2
//    - week-2: file_A committed
//    - week-1: file_B committed                    - week-1: file_C committed                  - week-1: file_D committed
//              file_A committed
//
// The result is an object containing the id of the timewindow and an array of dictionaries where each dictionary, like this
// {
//      timeWindowId: 'week-1',
//      fileTuples: {
//          'file_A-file_C-file_D': [file_A, file_C, file_D],
//          'file_B-file_C-file_D': [file_B, file_C, file_D]
//      }
// }
//
function fileTuplePerTimeWindow({
    key, // this is the id of the timewindow
    entries, // these are the files committed in that timewindow
}: {
    key: string;
    entries: FilesInfoDictionary[];
}) {
    const fileTuples = allTuples(entries);
    return { timeWindowId: key, fileTuples };
}

// returns the time windows in which there has been at least a commit in each repo, in other words the time windows where every repo has committed at least
// one file. Expects an array of FilesCommittedPerTimeWindowDict as input, where each FilesCommittedPerTimeWindowDict in the array has been built
// analyzing the commit logs of each repo involved in the analysis
//
// Example
//
// Repo_1 and Repo_2 have 2 commits with 1 file each. One time window is the same for the 2 repos, the other is different. Time windows are one week long.
//
// Repo_1                                                   Repo_2
//                                                              - week-3: file_2_repo_2 committed
//    - week-2: file_2_repo_1 committed
//    - week-1: file_1_repo_1 committed                         - week-1: file_1_repo_2 committed
//
// the result is an array containing 1 time window, the one corresponding to week-1, since this is the only time window where both repos have a commit
export function selectTimeWindowsPresentInAllRepos() {
    return pipe(
        map((filesCommittedPerTimeWindowDict: FilesCommittedPerTimeWindowDict[]) => {
            // calculate the time windows which are present in all dictionaries
            const commonTimeWindows = keysInAll(filesCommittedPerTimeWindowDict);
            return commonTimeWindows;
        }),
    );
}

export type FilesInfo = {
    repoIndex: number; // index of the repo to which the file belongs, i.e. first repo considered, second repo considered and so on
    path: string;
    cloc: number;
    linesAdded: number;
    linesDeleted: number;
    // array of the commit ids where the file has been committed - only commits which fall in the selected timewindows are considered
    // the selected timewindows are the ones which have at least one commit from all repos
    commits?: string[];
    // total number of commits for a file in the selected timewindows - should be the same as the lenght of the totCommits property
    totCommits?: number;
    totalNumberOfTimeWindowsWithCommits?: number; // total number of timewindows with at least one commit
    fileOccurrenciesInTimeWindows?: number; // number of timewindows where a file appears as committed
    // this property holds the ratio between the number of times a tuple is encoutered vs the number of times a file is encoutered.
    // We consider only the selected timewindows, i.e. the timewindows which have at least one commit in all the repos analyzed.
    // The number of times a file is encoutered should be equal or greated than the number of times we encounter a tuple in which the file is present.
    // If file F_A from Repo_1 is committed in the timewindows T_1 and T_2 while F_B from Repo_2 is committed only in the timewindow T_1. then
    // we will have 1 occrence of the tuple F_A-F_B but 2 occurrences of F_A and 1 occurence of F_B
    tupleFileOccurrenciesRatio?: number; // calculated as tupleOccurrenciesInTimeWindows / fileOccurrenciesInTimeWindows
};
export type FilesInfoDictionary = {
    [path: string]: FilesInfo;
};
export type FilesCommittedPerTimeWindowDict = {
    [timeWindow: string]: FilesInfoDictionary;
};

// Builds an array of dictionaries containing, for each timewindow, all the files committed in that timewindow.
// The array has one element per each repo
export function splitCommitsInTimeWindows(timeWindowLengthInDays: number) {
    return pipe(
        map((repoFileStreams: Observable<FileGitCommitEnriched>[]) =>
            repoFileStreams.map((s, index) => s.pipe(timeWindowedFileCommitsDict(timeWindowLengthInDays, index))),
        ),
        concatMap((timeWindowedFileDictionaries) => forkJoin(timeWindowedFileDictionaries)),
    );
}
// Builds a dictionary where there is an entry for each time window into which the total period of the analysis has been split
// as long as there has been at least one commit in that time window.
// The dictionary is built using the data contained in a stream of File objects.
// Each entry has a dictionary containing data about the files which have been committed in that period. The name of the files are the keys
// used in this dictionary.
// THie function is exported only for testing purposes
export function timeWindowedFileCommitsDict(timeWindowLengthInDays: number, repoIndex: number) {
    return pipe(
        reduce(
            (
                {
                    timeWindowDict,
                    numberOfCommitsPerFile: totCommitsPerFile,
                    commitIdsPerFile: commitsPerFile,
                    numberOfTimeWindows,
                    numOfOccurrenciesInTimeWindowsPerFile,
                },
                file: FileGitCommitEnriched,
            ) => {
                const timeWindowDictKey = timeWindowKey(file.committerDate, timeWindowLengthInDays);
                if (!timeWindowDict[timeWindowDictKey]) {
                    timeWindowDict[timeWindowDictKey] = {};
                    numberOfTimeWindows++;
                }
                // we count the number of timewindows where a file appears with a dictionary which has the file path as key. The value of this key is
                // another dictionary where is the timewindow id and the value is a boolean. If the boolean is true, it means that that certain file
                // has appeared in tha certain timewindo
                if (!numOfOccurrenciesInTimeWindowsPerFile[file.path]) {
                    numOfOccurrenciesInTimeWindowsPerFile[file.path] = {};
                }
                if (!numOfOccurrenciesInTimeWindowsPerFile[file.path][timeWindowDictKey]) {
                    numOfOccurrenciesInTimeWindowsPerFile[file.path][timeWindowDictKey] = true;
                }

                let fileData = timeWindowDict[timeWindowDictKey][file.path];
                if (!fileData) {
                    fileData = {
                        repoIndex,
                        cloc: file.cloc,
                        path: file.path,
                        linesAdded: 0,
                        linesDeleted: 0,
                    };
                    timeWindowDict[timeWindowDictKey][file.path] = fileData;
                }
                fileData.linesAdded = fileData.linesAdded + file.linesAdded;
                fileData.linesDeleted = fileData.linesDeleted + file.linesDeleted;
                if (!commitsPerFile[file.path]) {
                    commitsPerFile[file.path] = [];
                }
                commitsPerFile[file.path].push(file.hashShort);
                totCommitsPerFile[file.path] = totCommitsPerFile[file.path] ? totCommitsPerFile[file.path] + 1 : 1;
                return {
                    timeWindowDict,
                    numberOfCommitsPerFile: totCommitsPerFile,
                    commitIdsPerFile: commitsPerFile,
                    numberOfTimeWindows,
                    numOfOccurrenciesInTimeWindowsPerFile,
                };
            },
            {
                timeWindowDict: {} as FilesCommittedPerTimeWindowDict,
                numberOfCommitsPerFile: {} as { [path: string]: number },
                commitIdsPerFile: {} as { [path: string]: string[] },
                numberOfTimeWindows: 0,
                numOfOccurrenciesInTimeWindowsPerFile: {} as { [path: string]: { [timeWindowId: string]: boolean } },
            },
        ),
        // enrich with totCommits the files data contained in the dictionary
        map(
            ({
                timeWindowDict,
                numberOfCommitsPerFile: totCommitsPerFile,
                commitIdsPerFile: commitsPerFile,
                numberOfTimeWindows,
                numOfOccurrenciesInTimeWindowsPerFile,
            }) => {
                Object.values(timeWindowDict).forEach((files) => {
                    Object.values(files).forEach((file) => {
                        file.totCommits = totCommitsPerFile[file.path];
                        file.commits = commitsPerFile[file.path];
                        file.totalNumberOfTimeWindowsWithCommits = numberOfTimeWindows;
                        file.fileOccurrenciesInTimeWindows = Object.keys(
                            numOfOccurrenciesInTimeWindowsPerFile[file.path],
                        ).length;
                    });
                });
                return timeWindowDict;
            },
        ),
    );
}
// Creates the key for the filesCommittedPerTimeWindowDict.
// This function is exported for test purposes only
export function timeWindowKey(date: Date, timeWindowLengthInDays: number) {
    return Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * timeWindowLengthInDays));
}
//
//
// function buildReport(params: RepoCouplingReportParams) {
//     return pipe(
//         map(({ listOfCouplings }: { listOfCouplings: CouplingEntry[] }) => {
//             const report = new RepoCouplingReport(params);
//             report.filesCouplingInfo.val = listOfCouplings;
//             return report;
//         }),
//     );
// }
// export function addConsiderations(r: RepoCouplingReport) {
//     addConsiderationsHeader(r);
//     const mostCoupledFile = r.filesCouplingInfo.val.length > 0 ? r.filesCouplingInfo.val[0] : null;
//     if (mostCoupledFile) {
//         const howManyTimesPercentage = mostCoupledFile.howManyTimes_vs_totCommits;
//         const coupledWith = mostCoupledFile.path;
//         addConsideration(
//             r,
//             `It seems that ${howManyTimesPercentage}% of the times file ${mostCoupledFile.coupledFile} is committed also file ${coupledWith} is committed.`,
//         );
//     }
//     if (r.filesCouplingCsv.val) {
//         addConsideration(r, `The files coupling info have been saved in the file ${r.filesCouplingCsv.val}.`);
//     }
//     return r;
// }

export const REPO_INDEX_PATH_SEPARATOR = '**';
