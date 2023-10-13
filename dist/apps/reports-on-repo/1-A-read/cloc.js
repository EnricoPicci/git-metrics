"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocSummaryAsStreamOfStrings$ = void 0;
const rxjs_1 = require("rxjs");
const cloc_1 = require("../../../cloc-functions/cloc");
// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
function clocSummaryAsStreamOfStrings$(params, outFile, vcs) {
    return (0, cloc_1.clocSummary$)(params.folderPath, vcs, outFile).pipe((0, rxjs_1.concatMap)(stats => (0, rxjs_1.from)(stats)), (0, rxjs_1.map)(stat => `${stat.nFiles},${stat.language},${stat.blank},${stat.comment},${stat.code}`));
}
exports.clocSummaryAsStreamOfStrings$ = clocSummaryAsStreamOfStrings$;
//# sourceMappingURL=cloc.js.map