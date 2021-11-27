"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllReportsFromMultiRepos = void 0;
const rxjs_1 = require("rxjs");
const read_all_1 = require("../../git-read-enrich/read-all");
const create_outdir_1 = require("../../git-read-enrich/create-outdir");
const run_all_single_repo_reports_core_1 = require("./run-all-single-repo-reports-core");
const run_reports_on_multi_repos_core_1 = require("./run-reports-on-multi-repos-core");
const cloc_1 = require("../../git-read-enrich/cloc");
function runAllReportsFromMultiRepos(repoContainerFolderPath, filter, after, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, parallelReadOfCommits, noRenames) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const repoFolderPaths = (0, run_reports_on_multi_repos_core_1.gitRepos)(repoContainerFolderPath);
    return repoFolderPaths.pipe((0, rxjs_1.map)((_repoFolderPaths) => {
        const allCommitStreams = [];
        const allFileStreams = [];
        _repoFolderPaths.forEach((repoFolderPath) => {
            // read the data from git and cloc tool
            const commitOptions = { repoFolderPath, outDir, filter, noRenames };
            const readClocOptions = { repoFolderPath, outDir };
            const [commitLogPath, clocLogPath, clocSummaryPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
            // generation of the source streams
            const { _commitStream, _filesStream } = (0, run_all_single_repo_reports_core_1._streams)(commitLogPath, clocLogPath, clocSummaryPath, parallelReadOfCommits);
            allCommitStreams.push(_commitStream.pipe((0, rxjs_1.map)((commit) => {
                const _commit = Object.assign({}, commit);
                _commit.files.forEach((f) => {
                    f.path = `${repoFolderPath}--${f.path}`;
                });
                return _commit;
            })));
            allFileStreams.push(_filesStream);
        });
        const clocSummaryPath = (0, cloc_1.createSummaryClocLog)({ repoFolderPath: repoContainerFolderPath, outDir });
        const _clocSummaryStream = (0, cloc_1.clocSummaryStream)(clocSummaryPath);
        return {
            allCommitStreamsMerged: (0, rxjs_1.merge)(...allCommitStreams),
            allFileStreamsMerged: (0, rxjs_1.merge)(...allFileStreams),
            _clocSummaryStream,
        };
    }), (0, rxjs_1.concatMap)(({ allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream }) => {
        // run the reports
        return (0, run_all_single_repo_reports_core_1.runAllSingleRepoReportsFromStreams)(repoContainerFolderPath, filter, after, outDir, outFilePrefix, clocDefsPath, depthInFilesCoupling, allCommitStreamsMerged, allFileStreamsMerged, _clocSummaryStream);
    }));
}
exports.runAllReportsFromMultiRepos = runAllReportsFromMultiRepos;
//# sourceMappingURL=run-reports-from-multi-repos-core.js.map