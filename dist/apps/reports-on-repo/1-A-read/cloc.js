"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSummaryClocOutfile = exports.clocSummaryAsStreamOfStrings$ = void 0;
const path = require("path");
const rxjs_1 = require("rxjs");
const cloc_1 = require("../../../cloc-functions/cloc");
const file_name_utils_1 = require("../../../git-functions/utils/file-name-utils");
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function clocSummaryAsStreamOfStrings$(params, outFile, vcs) {
    return (0, cloc_1.clocSummary$)(params.folderPath, vcs, outFile).pipe((0, rxjs_1.concatMap)(stats => (0, rxjs_1.from)(stats)), (0, rxjs_1.map)(stat => `${stat.nFiles},${stat.language},${stat.blank},${stat.comment},${stat.code}`));
}
exports.clocSummaryAsStreamOfStrings$ = clocSummaryAsStreamOfStrings$;
function buildSummaryClocOutfile(params) {
    const outDir = params.outDir ? params.outDir : './';
    const outFile = (0, file_name_utils_1.buildOutfileName)(params.outClocFile, params.folderPath, params.outClocFilePrefix, '-cloc-summary.csv');
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}
exports.buildSummaryClocOutfile = buildSummaryClocOutfile;
//# sourceMappingURL=cloc.js.map