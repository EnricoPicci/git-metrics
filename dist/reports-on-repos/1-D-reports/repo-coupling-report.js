"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatFilesCsv = exports.repoCouplingReport = exports.RepoCouplingReport = exports.REPO_COUPLING_REPORT_NAME = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const report_config_1 = require("./config/report-config");
const report_1 = require("./report");
const to_csv_1 = require("../../0-tools/csv/to-csv");
const dictionary_utils_1 = require("../../0-tools/dictionary-utils/dictionary-utils");
exports.REPO_COUPLING_REPORT_NAME = 'AuthorChurnReport';
class RepoCouplingReport extends report_1.Report {
    constructor(_params) {
        super(_params, exports.REPO_COUPLING_REPORT_NAME, `Repo coupling report`);
        if (_params.timeWindowLengthInDays === undefined) {
            _params.timeWindowLengthInDays = report_config_1.REPORT_CONFIG.timeWindowLengthInDays;
        }
    }
}
exports.RepoCouplingReport = RepoCouplingReport;
function repoCouplingReport(fileTuplesDict, csvFilePath) {
    return fileTuplesDict.pipe(flatFilesCsv(), (0, operators_1.toArray)(), (0, operators_1.concatMap)((lines) => {
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
                var _a;
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
                ft.occurrenciesInTimeWindows = f.fileOccurrenciesInTimeWindows || 0;
                ft.tupleFileOccurrenciesInTimeWindowsRatio = f.tupleFileOccurrenciesRatio || 0;
                ft.totNumberOfCommits = f.totCommits || 0;
                ft.totNumberOfTimeWindowsWithCommits = f.totalNumberOfTimeWindowsWithCommits || 0;
                //
                ft.cloc = f.cloc;
                ft.linesAdded = f.linesAdded;
                ft.linesDeleted = f.linesDeleted;
                // transform the array of commits into a string so that all info about the commits are stored in one string field which is handy for csv
                ft.commitIds = ((_a = f.commits) === null || _a === void 0 ? void 0 : _a.join('-')) || '';
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
//# sourceMappingURL=repo-coupling-report.js.map