"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRepoCouplingReport = void 0;
const create_outdir_1 = require("../../1-A-read/create-outdir");
const read_all_1 = require("../../1-A-read/read-all");
const files_1 = require("../../1-B-git-enriched-streams/files");
const repo_coupling_report_1 = require("../../1-D-reports/repo-coupling-report");
const repo_coupling_aggregate_1 = require("../../1-C-aggregate-in-memory/repo-coupling-aggregate");
function runRepoCouplingReport(repoFolderPaths, timeWindowLengthInDays, csvFilePath, filter, after, outDir, outFile, outClocFile, clocDefsPath) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const fileStreams = repoFolderPaths.map((repoFolderPath) => {
        const commitOptions = { filter, outDir: outDir, repoFolderPath, outFile, after, reverse: true };
        const params = { outDir: outDir, folderPath: repoFolderPath, outClocFile, clocDefsPath, vcs: 'git' };
        const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, params);
        return (0, files_1.filesStream)(commitLogPath, clocLogPath);
    });
    const fileTupleDict = (0, repo_coupling_aggregate_1.fileTuplesDict)(fileStreams, timeWindowLengthInDays);
    return (0, repo_coupling_report_1.repoCouplingReport)(fileTupleDict, csvFilePath);
}
exports.runRepoCouplingReport = runRepoCouplingReport;
//# sourceMappingURL=run-repo-coupling-report-core.js.map