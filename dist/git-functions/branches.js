"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBranchesGraphCommand = exports.defaultBranchName$ = exports.readBranchesGraph = void 0;
const path_1 = __importDefault(require("path"));
const execute_command_1 = require("../tools/execute-command/execute-command");
const file_name_utils_1 = require("./utils/file-name-utils");
const rxjs_1 = require("rxjs");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Reads the branches graph from a Git repository and logs a message to the console indicating the folder
 * where the branches graph was read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readBranchesGraphCommand` function.
 * @returns The path to the file where the output was saved.
 */
function readBranchesGraph(config) {
    const [cmd, out] = readBranchesGraphCommand(config);
    (0, execute_command_1.executeCommand)('readBranchesGraph', cmd);
    console.log(`====>>>> Branches graph read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readBranchesGraph = readBranchesGraph;
/**
 * Fetches the default branch name for a Git repository and returns an Observable that emits the branch name.
 * @param repoPath The path to the Git repository.
 * @returns An Observable that emits the default branch name for the repository.
 * @throws An error if the output of the git command does not match the expected format.
 */
function defaultBranchName$(repoPath) {
    // build the command to fetch the default branch name
    // see https://stackoverflow.com/a/67170894
    const gitCommand = `cd ${repoPath} && git pull && git branch --remotes --list '*/HEAD'`;
    return (0, execute_command_1.executeCommandObs)(`fetch default branch name for ${repoPath}`, gitCommand).pipe((0, rxjs_1.map)((output) => {
        // the output is something like:
        // fetching origin
        // origin/HEAD -> origin/master
        // hence we split the second line with / and take the third element
        const lines = output.split('\n');
        if (lines.length < 2) {
            throw new Error(`Error: while fetching default branch name for repo "${repoPath}"
                we expected to have at least 2 lines with the first one being something like "fetching origin" but we got "${output}"
                Command erroring: "${gitCommand}"`);
        }
        // we take the second line which we expect to be something like "origin/HEAD -> origin/master"
        const parts = output.split('\n')[1].split('/');
        if (parts.length !== 3) {
            throw new Error(`Error: while fetching default branch name for repo "${repoPath}"
                we expected a string with format "origin/HEAD -> origin/master" but we got "${output}"
                Command erroring: "${gitCommand}"`);
        }
        const branchName = parts[2];
        return branchName;
    }));
}
exports.defaultBranchName$ = defaultBranchName$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
// private function exported only for test purposes
function readBranchesGraphCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = (0, file_name_utils_1.buildOutfileName)(config.outFile, repoFolder, '', '-branches.log');
    const out = path_1.default.resolve(path_1.default.join(outDir, outFile));
    return [`git ${repoFolder} log --all --graph --date=short --pretty=medium > ${out}`, out];
}
exports.readBranchesGraphCommand = readBranchesGraphCommand;
//# sourceMappingURL=branches.js.map