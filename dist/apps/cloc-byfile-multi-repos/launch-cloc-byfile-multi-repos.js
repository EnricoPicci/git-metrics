"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClocByfileMultiRepos = void 0;
const commander_1 = require("commander");
const cloc_1 = require("../../cloc-functions/cloc");
function launchClocByfileMultiRepos() {
    console.log('====>>>> Launching Cloc For Repos');
    const { folderPath, outdir, languages, excludeRepoPaths } = readParams();
    (0, cloc_1.writeClocByFileForRepos$)(folderPath, outdir, languages, excludeRepoPaths).subscribe();
}
exports.launchClocByfileMultiRepos = launchClocByfileMultiRepos;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to run the cloc command (which counts lines of code) for a set of repos contained in a folder')
        .requiredOption('--folderPath <string>', `folder containing the repos to analyze (e.g. ./repos)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`).option('--languages <string...>', `a space separated list of languages to be considered in the diff (e.g. --languages "Java" "Python")
- default is the empty list which means all languages`).option('--excludeRepoPaths <string...>', `a space separated list of folder names to be excluded from the analysis (e.g. --excludeRepoPaths "dbm" "dbobjects") -
default is the empty list which means no repos are excluded
wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    const languages = _options.languages || [];
    return { folderPath: _options.folderPath, outdir, languages, excludeRepoPaths: _options.excludeRepoPaths };
}
//# sourceMappingURL=launch-cloc-byfile-multi-repos.js.map