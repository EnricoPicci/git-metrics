"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPO_INDEX_PATH_SEPARATOR = exports.timeWindowKey = exports.timeWindowedFileCommitsDict = exports.splitCommitsInTimeWindows = exports.selectTimeWindowsPresentInAllRepos = exports.calculateFileTuplesPerTimeWindow = exports.groupFileTuples = exports.flatFilesCsv = exports.repoCouplingReport = exports.repoCouplingReport_ = exports.RepoCouplingReport = exports.REPO_COUPLING_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const report_config_1 = require("./config/report-config");
const report_1 = require("./report");
const dictionary_utils_1 = require("./dictionary-utils/dictionary-utils");
const to_csv_1 = require("../tools/csv/to-csv");
exports.REPO_COUPLING_REPORT_NAME = 'AuthorChurnReport';
class RepoCouplingReport extends report_1.Report {
    // filesCouplingInfo = {
    //     val: [] as CouplingEntry[],
    //     description: `Files whith an high number of commits potentially coupled`,
    // };
    // filesCouplingCsv: { val?: string; description: string } = {
    //     description: `csv file where the data about the potential couplings is saved`,
    // };
    constructor(_params) {
        super(_params);
        this.name = exports.REPO_COUPLING_REPORT_NAME;
        this.description = `Repo coupling report`;
        if (_params.timeWindowLengthInDays === undefined) {
            _params.timeWindowLengthInDays = report_config_1.REPORT_CONFIG.timeWindowLengthInDays;
        }
    }
}
exports.RepoCouplingReport = RepoCouplingReport;
function repoCouplingReport_(params, csvFilePath) {
    console.log(params, csvFilePath);
    return null;
    // return pipe(couplingDict(), couplingList(params), buildReport(params));
}
exports.repoCouplingReport_ = repoCouplingReport_;
function repoCouplingReport(fileCommitStreams, timeWindowLengthInDays, csvFilePath) {
    return (0, rxjs_1.of)(fileCommitStreams).pipe(splitCommitsInTimeWindows(timeWindowLengthInDays), selectTimeWindowsPresentInAllRepos(), calculateFileTuplesPerTimeWindow(), groupFileTuples(), flatFilesCsv(), (0, operators_1.toArray)(), (0, operators_1.concatMap)((lines) => {
        return (0, observable_fs_1.writeFileObs)(csvFilePath, lines);
    }), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> REPO COUPLING REPORT GENERATED -- data saved in ${csvFilePath}`);
        },
    }));
}
exports.repoCouplingReport = repoCouplingReport;
function flatFilesCsv() {
    // file, howManyTimes, togetherWith_1, togetherWith_2, togetherWith_N, occurrenciesInTimewindos, tupleFileOccurrenciesInTimewindowwRatio, totNumberOfCommits,
    return (0, rxjs_1.pipe)((0, operators_1.map)((fileTuples) => {
        return Object.entries(fileTuples).reduce((flatFileTuples, [fileTupleId, { tupleOccurrenciesInTimeWindow, files }]) => {
            const fileTuples = Object.values(files).map((f) => {
                const ft = {
                    repoIndex: f.repoIndex,
                    file: f.path,
                    howManyTimes: tupleOccurrenciesInTimeWindow,
                };
                // add the other files of the tuple as properties
                fileTupleId.split(dictionary_utils_1.TUPLE_KEY_SEPARATOR).forEach((fileInTuple, i) => {
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
        }, []);
    }), 
    // mergeMap transform the array into a stream of objects
    (0, operators_1.mergeMap)((flatFiles) => flatFiles), (0, to_csv_1.toCsvObs)());
}
exports.flatFilesCsv = flatFilesCsv;
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
                            tupleFileOccurrenciesRatio: _touple.tupleOccurrenciesInTimeWindow / f.fileOccurrenciesInTimeWindows,
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
exports.REPO_INDEX_PATH_SEPARATOR = '**';
//# sourceMappingURL=repo-coupling-report.js.map