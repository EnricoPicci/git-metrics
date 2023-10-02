import { pipe, Observable, forkJoin, of } from 'rxjs';
import { reduce, map, concatMap } from 'rxjs/operators';
import { allTuples, keysInAll } from '../../../tools/dictionary-utils/dictionary-utils';
import { FileGitCommitEnriched } from '../1-B-git-enriched-types/git-types';
import { FileTuplesDict } from '../1-C-aggregate-types/file-tuples';

// receives an array of Observables of FileGitCommitEnriched objects coming from the repos we want to analize for possible couplings
// splits the Observables in time windows and select the time windows where all repos have at least one commit
// then calculates the tuples of files for each time window, tuple being a combination of files each one coming from different repos under investigation
// finally groupls the file tuples in a dictionary
export function fileTuplesDict(fileCommitStreams: Observable<FileGitCommitEnriched>[], timeWindowLengthInDays: number) {
    return of(fileCommitStreams).pipe(
        splitCommitsInTimeWindows(timeWindowLengthInDays),
        selectTimeWindowsPresentInAllRepos(),
        calculateFileTuplesPerTimeWindow(),
        groupFileTuples(),
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
                                        _touple.tupleOccurrenciesInTimeWindow / (f.fileOccurrenciesInTimeWindows || 1),
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
                }, {} as FileTuplesDict);
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
    commits: string[];
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
                        cloc: file.code,
                        path: file.path,
                        linesAdded: 0,
                        linesDeleted: 0,
                        commits: [],
                    };
                    timeWindowDict[timeWindowDictKey][file.path] = fileData;
                }
                fileData.linesAdded = fileData.linesAdded + (file.linesAdded || 0);
                fileData.linesDeleted = fileData.linesDeleted + (file.linesDeleted || 0);
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

export const REPO_INDEX_PATH_SEPARATOR = '**';
