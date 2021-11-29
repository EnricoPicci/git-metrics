"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitReadCommitEnrich = exports.gitReadEnrich = void 0;
const commits_1 = require("./commits");
const files_1 = require("./files");
const read_all_1 = require("./read-all");
// API to read the git log and run the cloc command and return a stream of GitCommitEnriched and a stream of FileGitCommitEnriched objects
// we must load all commits to be able to determine the creation date of a file
// since the creation date is determined by the first commit the file was in, therefore we do not specify
// the "after" propety in the "commitOptions" object
function gitReadEnrich(repoFolderPath, filter, outDir, outFile, outClocFile, clocDefsPath) {
    const commitOptions = { filter, outDir, repoFolderPath, outFile };
    const readClocOptions = { outDir, repoFolderPath, outClocFile, clocDefsPath };
    const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    const commits = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    const fileCommits = (0, files_1.filesStreamFromEnrichedCommitsStream)(commits);
    return [commits, fileCommits];
}
exports.gitReadEnrich = gitReadEnrich;
// API to read the git log and run the cloc command and return a stream of GitCommitEnriched
// we must load all commits to be able to determine the creation date of a file
// since the creation date is determined by the first commit the file was in, therefore we do not specify
// the "after" propety in the "commitOptions" object
function gitReadCommitEnrich(repoFolderPath, filter, outDir, outFile, outClocFile, clocDefsPath, reverse) {
    const commitOptions = { filter, outDir, repoFolderPath, outFile, reverse };
    const readClocOptions = { outDir, repoFolderPath, outClocFile, clocDefsPath };
    const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    const commits = (0, commits_1.enrichedCommitsStream)(commitLogPath, clocLogPath);
    return commits;
}
exports.gitReadCommitEnrich = gitReadCommitEnrich;
//# sourceMappingURL=git-read-enrich.js.map