"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocOnFolder = void 0;
const commander_1 = require("commander");
const cloc_on_folders_1 = require("./internals/cloc-on-folders");
function launchClocOnFolder() {
    console.log('====>>>> Launching Cloc on Repos');
    const { folderPath, outdir, outClocFilePrefix } = readParams();
    (0, cloc_on_folders_1.clocOnFolders)(folderPath, outdir, outClocFilePrefix);
}
exports.launchClocOnFolder = launchClocOnFolder;
function readParams() {
    const program = new commander_1.Command();
    program
        .description(`A command to calculate cloc (number of lines of code) of all the folders contained in a folder.
        If the folder contains a .git folder, the cloc will be calculated on the repo contained in the folder.
        This means that the cloc will be calculated on the repo, not on the folder (for instance: if the repo is a node
        app, then the node_module folder, which is not saved in the repo, is not considered by the cloc command).`)
        .requiredOption('--folderPath <string>', `folder containing the folders to analyze (e.g. ./my-folder-containing-folders)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./out) - default is the current directory`)
        .option('--outClocFilePrefix <string>', `a prefix to be added to the outpt file (e.g. ./my-prefix-) - default is the empty string`, '');
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { folderPath: _options.folderPath, outdir, outClocFilePrefix: _options.outClocFilePrefix };
}
//# sourceMappingURL=launch-cloc-on-folders.js.map