import { ClocParams } from "../../../cloc-functions/cloc-params"
import { writeClocByfile } from "../../../cloc-functions/cloc.functions"

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
export function clocOnFolders(folderPath: string, outDir = './', outClocFilePrefix = '') {
    const params: ClocParams = {
        folderPath,
        outDir,
        outClocFilePrefix,
        vcs: 'git',
    }

    return writeClocByfile(params)
}