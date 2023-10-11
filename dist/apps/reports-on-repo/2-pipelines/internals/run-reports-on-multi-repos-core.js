"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllReportsOnMultiRepos = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const read_all_1 = require("../../1-A-read/read-all");
const create_outdir_1 = require("../../1-A-read/create-outdir");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
function runAllReportsOnMultiRepos(reports, repoFolderPaths, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, concurrentReadOfCommits, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const allReports = repoFolderPaths.map((repoFolderPath) => {
        // read the data from git and cloc tool
        const commitOptions = { repoFolderPath, outDir, filter, noRenames, reverse: true };
        const clocParams = { folderPath: repoFolderPath, outDir, vcs: 'git' };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, clocParams);
        // generation of the source streams
        const { _commitStream, _filesStream, _clocSummaryStream } = (0, run_reports_on_repo_core_1._streams)(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits);
        // run the reports
        return (0, run_reports_on_repo_core_1._runReportsFromStreams)(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream).pipe((0, operators_1.map)((reports) => {
            return { reports, repoFolderPath };
        }));
    });
    return (0, rxjs_1.forkJoin)(allReports);
}
exports.runAllReportsOnMultiRepos = runAllReportsOnMultiRepos;
//# sourceMappingURL=run-reports-on-multi-repos-core.js.map