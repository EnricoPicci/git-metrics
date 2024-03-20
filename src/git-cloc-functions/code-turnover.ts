
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

import { WriteCodeTurnoverOptions, writeCodeTurnover$ } from "./cloc-diff-commit";

/**
 * Calculates the code turnover for a set of repositories and returns an Observable that emits when the operation is complete.
 * @param folderPath The path to the folder containing the repositories.
 * @param options An object containing options for the operation. Defaults to an empty object.
 * @returns An Observable that emits when the operation is complete.
 */
export function codeTurnover$(
    folderPath: string,
    options: WriteCodeTurnoverOptions = {}
) {
    return writeCodeTurnover$(folderPath, options)
}