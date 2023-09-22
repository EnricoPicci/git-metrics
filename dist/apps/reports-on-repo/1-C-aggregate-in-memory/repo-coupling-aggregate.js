"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPO_INDEX_PATH_SEPARATOR = exports.timeWindowKey = exports.timeWindowedFileCommitsDict = exports.splitCommitsInTimeWindows = exports.selectTimeWindowsPresentInAllRepos = exports.calculateFileTuplesPerTimeWindow = exports.groupFileTuples = exports.fileTuplesDict = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const dictionary_utils_1 = require("../../../0-tools/dictionary-utils/dictionary-utils");
// receives an array of Observables of FileGitCommitEnriched objects coming from the repos we want to analize for possible couplings
// splits the Observables in time windows and select the time windows where all repos have at least one commit
// then calculates the tuples of files for each time window, tuple being a combination of files each one coming from different repos under investigation
// finally groupls the file tuples in a dictionary
function fileTuplesDict(fileCommitStreams, timeWindowLengthInDays) {
    return (0, rxjs_1.of)(fileCommitStreams).pipe(splitCommitsInTimeWindows(timeWindowLengthInDays), selectTimeWindowsPresentInAllRepos(), calculateFileTuplesPerTimeWindow(), groupFileTuples());
}
exports.fileTuplesDict = fileTuplesDict;
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
function groupFileTuples() {
    return (0, rxjs_1.pipe)((0, operators_1.map)((fileTuplesPerTimeWindow) => {
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
                            tupleFileOccurrenciesRatio: _touple.tupleOccurrenciesInTimeWindow / (f.fileOccurrenciesInTimeWindows || 1),
                        };
                        const fileKey = `${f.path}${exports.REPO_INDEX_PATH_SEPARATOR} (repoIndex ;${f.repoIndex})`;
                        _touple.files[fileKey] = _file;
                    }
                    _file.linesAdded = _file.linesAdded + f.linesAdded;
                    _file.linesDeleted = _file.linesDeleted + f.linesDeleted;
                    _file.commits = [..._file.commits, ...f.commits];
                });
            });
            return fileTuplesDict;
        }, {});
    }));
}
exports.groupFileTuples = groupFileTuples;
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
function calculateFileTuplesPerTimeWindow() {
    return (0, rxjs_1.pipe)((0, operators_1.map)((timeWindows) => timeWindows.map((tw) => fileTuplePerTimeWindow(tw))));
}
exports.calculateFileTuplesPerTimeWindow = calculateFileTuplesPerTimeWindow;
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
function fileTuplePerTimeWindow({ key, // this is the id of the timewindow
entries, // these are the files committed in that timewindow
 }) {
    const fileTuples = (0, dictionary_utils_1.allTuples)(entries);
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
function selectTimeWindowsPresentInAllRepos() {
    return (0, rxjs_1.pipe)((0, operators_1.map)((filesCommittedPerTimeWindowDict) => {
        // calculate the time windows which are present in all dictionaries
        const commonTimeWindows = (0, dictionary_utils_1.keysInAll)(filesCommittedPerTimeWindowDict);
        return commonTimeWindows;
    }));
}
exports.selectTimeWindowsPresentInAllRepos = selectTimeWindowsPresentInAllRepos;
// Builds an array of dictionaries containing, for each timewindow, all the files committed in that timewindow.
// The array has one element per each repo
function splitCommitsInTimeWindows(timeWindowLengthInDays) {
    return (0, rxjs_1.pipe)((0, operators_1.map)((repoFileStreams) => repoFileStreams.map((s, index) => s.pipe(timeWindowedFileCommitsDict(timeWindowLengthInDays, index)))), (0, operators_1.concatMap)((timeWindowedFileDictionaries) => (0, rxjs_1.forkJoin)(timeWindowedFileDictionaries)));
}
exports.splitCommitsInTimeWindows = splitCommitsInTimeWindows;
// Builds a dictionary where there is an entry for each time window into which the total period of the analysis has been split
// as long as there has been at least one commit in that time window.
// The dictionary is built using the data contained in a stream of File objects.
// Each entry has a dictionary containing data about the files which have been committed in that period. The name of the files are the keys
// used in this dictionary.
// THie function is exported only for testing purposes
function timeWindowedFileCommitsDict(timeWindowLengthInDays, repoIndex) {
    return (0, rxjs_1.pipe)((0, operators_1.reduce)(({ timeWindowDict, numberOfCommitsPerFile: totCommitsPerFile, commitIdsPerFile: commitsPerFile, numberOfTimeWindows, numOfOccurrenciesInTimeWindowsPerFile, }, file) => {
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
    }, {
        timeWindowDict: {},
        numberOfCommitsPerFile: {},
        commitIdsPerFile: {},
        numberOfTimeWindows: 0,
        numOfOccurrenciesInTimeWindowsPerFile: {},
    }), 
    // enrich with totCommits the files data contained in the dictionary
    (0, operators_1.map)(({ timeWindowDict, numberOfCommitsPerFile: totCommitsPerFile, commitIdsPerFile: commitsPerFile, numberOfTimeWindows, numOfOccurrenciesInTimeWindowsPerFile, }) => {
        Object.values(timeWindowDict).forEach((files) => {
            Object.values(files).forEach((file) => {
                file.totCommits = totCommitsPerFile[file.path];
                file.commits = commitsPerFile[file.path];
                file.totalNumberOfTimeWindowsWithCommits = numberOfTimeWindows;
                file.fileOccurrenciesInTimeWindows = Object.keys(numOfOccurrenciesInTimeWindowsPerFile[file.path]).length;
            });
        });
        return timeWindowDict;
    }));
}
exports.timeWindowedFileCommitsDict = timeWindowedFileCommitsDict;
// Creates the key for the filesCommittedPerTimeWindowDict.
// This function is exported for test purposes only
function timeWindowKey(date, timeWindowLengthInDays) {
    return Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * timeWindowLengthInDays));
}
exports.timeWindowKey = timeWindowKey;
exports.REPO_INDEX_PATH_SEPARATOR = '**';
//# sourceMappingURL=repo-coupling-aggregate.js.map