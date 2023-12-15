"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromCsvFile$ = void 0;
const rxjs_1 = require("rxjs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
function fromCsvFile$(filePath, separator = ',') {
    return (0, observable_fs_1.readLinesObs)(filePath).pipe((0, rxjs_1.map)(lines => (0, csv_tools_1.fromCsvArray)(lines, separator)));
}
exports.fromCsvFile$ = fromCsvFile$;
//# sourceMappingURL=from-csv-file.js.map