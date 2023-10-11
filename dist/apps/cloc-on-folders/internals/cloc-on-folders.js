"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clocOnFolders = void 0;
const cloc_functions_1 = require("../../../cloc-functions/cloc.functions");
/**
 * Calculates the lines of code for a folder containing multiple folders using the cloc tool.
 * If the folder contains a .git folder, the cloc will be calculated on the repo contained in the folder.
 * This means that the cloc will be calculated on the repo, not on the folder (for instance: if the repo is a node
 * app, then the node_module folder, which is not saved in the repo, is not considered by the cloc command).
 * The function writes the output to a file in the specified output directory.
 * @param folderPath The path to the folder containing the Git repositories.
 * @param outDir The path to the output directory. Defaults to './'.
 * @param outClocFilePrefix A prefix to add to the output file names.
 * @returns the name of the output file.
 */
function clocOnFolders(folderPath, outDir = './', outClocFilePrefix = '') {
    const params = {
        folderPath,
        outDir,
        outClocFilePrefix,
        vcs: 'git',
    };
    return (0, cloc_functions_1.writeClocByfile)(params);
}
exports.clocOnFolders = clocOnFolders;
//# sourceMappingURL=cloc-on-folders.js.map