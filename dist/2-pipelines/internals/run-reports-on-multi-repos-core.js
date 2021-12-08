"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitRepos = exports.runAllReportsOnMultiRepos = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const read_all_1 = require("../../1-A-read/read-all");
const create_outdir_1 = require("../../1-A-read/create-outdir");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
function runAllReportsOnMultiRepos(reports, repoFolderPaths, filter, after, before, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, concurrentReadOfCommits, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const allReports = repoFolderPaths.map((repoFolderPath) => {
        // read the data from git and cloc tool
        const commitOptions = { repoFolderPath, outDir, filter, noRenames, reverse: true };
        const readClocOptions = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        // generation of the source streams
        const { _commitStream, _filesStream, _clocSummaryStream } = (0, run_reports_on_repo_core_1._streams)(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits, after, before);
        // run the reports
        return (0, run_reports_on_repo_core_1.runReportsFromStreams)(reports, repoFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, _commitStream, _filesStream, _clocSummaryStream).pipe((0, operators_1.map)((reports) => {
            return { reports, repoFolderPath };
        }));
    });
    return (0, rxjs_1.forkJoin)(allReports);
}
exports.runAllReportsOnMultiRepos = runAllReportsOnMultiRepos;
function gitRepos(startingFolder = './') {
    return (0, observable_fs_1.dirNamesListObs)(startingFolder).pipe((0, operators_1.mergeMap)((folders) => folders.map((folder) => path_1.default.join(startingFolder, folder))), (0, operators_1.mergeMap)((folder) => {
        return (0, observable_fs_1.dirNamesListObs)(folder).pipe((0, operators_1.map)((folderDirs) => ({ folder, folderDirs })));
    }), (0, operators_1.filter)(({ folderDirs }) => {
        return folderDirs.some((dir) => dir === '.git');
    }), (0, operators_1.map)(({ folder }) => folder), (0, operators_1.toArray)());
}
exports.gitRepos = gitRepos;
//# sourceMappingURL=run-reports-on-multi-repos-core.js.map