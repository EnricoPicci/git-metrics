"use strict";
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeTurnover$ = void 0;
const cloc_diff_commit_1 = require("./cloc-diff-commit");
/**
 * Calculates the code turnover for a set of repositories and returns an Observable that emits when the operation is complete.
 * @param folderPath The path to the folder containing the repositories.
 * @param options An object containing options for the operation. Defaults to an empty object.
 * @returns An Observable that emits when the operation is complete.
 */
function codeTurnover$(folderPath, options = { filePrefix: 'code-turnover' }) {
    return (0, cloc_diff_commit_1.writeCodeTurnover$)(folderPath, options);
}
exports.codeTurnover$ = codeTurnover$;
//# sourceMappingURL=code-turnover.js.map