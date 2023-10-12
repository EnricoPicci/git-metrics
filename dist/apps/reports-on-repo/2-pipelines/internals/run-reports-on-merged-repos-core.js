"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllReportsOnMergedRepos = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const read_all_1 = require("../../1-A-read/read-all");
const create_outdir_1 = require("../../1-A-read/create-outdir");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
const cloc_1 = require("../../../../cloc-functions/cloc");
const repo_path_functions_1 = require("../../../../git-functions/repo-path.functions");
function runAllReportsOnMergedRepos(reports, repoContainerFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, concurrentReadOfCommits, noRenames, excludeRepoPaths) {
    // create the output directory if not existing
    const _outDir = path_1.default.resolve(outDir ? outDir : '');
    (0, create_outdir_1.createDirIfNotExisting)(_outDir);
    const repoFolderPaths = (0, repo_path_functions_1.gitRepoPaths)(repoContainerFolderPath, excludeRepoPaths);
    return repoFolderPaths.pipe((0, rxjs_1.map)((_repoFolderPaths) => {
        const allCommitStreams = [];
        const allFileStreams = [];
        _repoFolderPaths.forEach((repoFolderPath) => {
            // read the data from git and cloc tool
            const commitOptions = {
                repoFolderPath,
                outDir: _outDir,
                filter,
                noRenames,
                reverse: true,
            };
            const clocParams = { folderPath: repoFolderPath, outDir: _outDir, vcs: 'git' };
            const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, clocParams);
            // generation of the source streams
            const { _commitStream, _filesStream } = (0, run_reports_on_repo_core_1._streams)(commitLogPath, clocLogPath, clocSummaryPath, concurrentReadOfCommits);
            allCommitStreams.push(_commitStream.pipe((0, rxjs_1.map)((commit) => {
                const _commit = Object.assign({}, commit);
                _commit.files.forEach((f) => {
                    f.path = `${repoFolderPath}--${f.path}`;
                });
                return _commit;
            })));
            allFileStreams.push(_filesStream);
        });
        const clocSummaryPath = (0, cloc_1.writeClocSummary)({ folderPath: repoContainerFolderPath, outDir: _outDir, vcs: 'git' });
        const _clocSummaryStream = (0, cloc_1.clocSummaryCsvRaw$)(clocSummaryPath);
        return {
            allCommitStreamsMerged: (0, rxjs_1.merge)(...allCommitStreams),
            allFileStreamsMerged: (0, rxjs_1.merge)(...allFileStreams),
            _clocSummaryStream,
        };
    }), (0, rxjs_1.concatMap)(({ allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream }) => {
        // run the reports
        return (0, run_reports_on_repo_core_1._runReportsFromStreams)(reports, repoContainerFolderPath, filter, after, before, _outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream);
    }));
}
exports.runAllReportsOnMergedRepos = runAllReportsOnMergedRepos;
//# sourceMappingURL=run-reports-on-merged-repos-core.js.map