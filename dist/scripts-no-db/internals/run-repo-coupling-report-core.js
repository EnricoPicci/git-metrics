"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRepoCouplingReport = void 0;
const files_1 = require("../../git-read-enrich/files");
const create_outdir_1 = require("../../git-read-enrich/create-outdir");
const read_all_1 = require("../../git-read-enrich/read-all");
const repo_coupling_report_1 = require("../../reports/repo-coupling-report");
function runRepoCouplingReport(repoFolderPaths, timeWindowLengthInDays, csvFilePath, filter, after, outDir, outFile, outClocFile, clocDefsPath) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    const fileStreams = repoFolderPaths.map((repoFolderPath) => {
        const commitOptions = { filter, outDir, repoFolderPath, outFile, after };
        const readClocOptions = { outDir, repoFolderPath, outClocFile, clocDefsPath };
        const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
        return (0, files_1.filesStream)(commitLogPath, clocLogPath);
    });
    return (0, repo_coupling_report_1.repoCouplingReport)(fileStreams, timeWindowLengthInDays, csvFilePath);
}
exports.runRepoCouplingReport = runRepoCouplingReport;
//# sourceMappingURL=run-repo-coupling-report-core.js.map