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
const cloc_1 = require("../../1-A-read/cloc");
const run_reports_on_multi_repos_core_1 = require("./run-reports-on-multi-repos-core");
const run_reports_on_repo_core_1 = require("./run-reports-on-repo-core");
function runAllReportsOnMergedRepos(reports, repoContainerFolderPath, filter, after, before, outDir, outFilePrefix, clocDefsPath, ignoreClocZero, depthInFilesCoupling, concurrentReadOfCommits, noRenames) {
    // create the output directory if not existing
    const _outDir = path_1.default.resolve(outDir ? outDir : '');
    (0, create_outdir_1.createDirIfNotExisting)(_outDir);
    const repoFolderPaths = (0, run_reports_on_multi_repos_core_1.gitRepos)(repoContainerFolderPath);
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
            const readClocOptions = { repoFolderPath, outDir: _outDir };
            const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
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
        const clocSummaryPath = (0, cloc_1.createSummaryClocLog)({ repoFolderPath: repoContainerFolderPath, outDir: _outDir });
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
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