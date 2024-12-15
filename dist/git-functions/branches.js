"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBranchesGraphCommand = exports.lastBranch$ = exports.localAndNonLocalBranches$ = exports.defaultBranchName$ = exports.readBranchesGraph = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../tools/execute-command/execute-command");
const file_name_utils_1 = require("./utils/file-name-utils");
const git_errors_1 = require("./git-errors");
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
function defaultBranchName$(repoPath, options = {}) {
    // build the command to fetch the default branch name
    // see https://stackoverflow.com/a/67170894
    const gitCommand = `cd ${repoPath} && git branch --remotes --list '*/HEAD'`;
    return (0, execute_command_1.executeCommandObs$)(`fetch default branch name for ${repoPath}`, gitCommand, options).pipe((0, rxjs_1.map)((output) => {
        // if the output is the empty string, then it means that the repository is empty
        if (output === '') {
            const errMsg = `Error: while fetching default branch name for repo "${repoPath}"
                the output of the command "${gitCommand}" was empty, which means that the repository is empty`;
            throw new git_errors_1.GitError(errMsg, repoPath, gitCommand);
        }
        // the output is something like:
        // "origin/HEAD -> origin/master\n"
        // hence we split by \n and take the first line
        const lines = output.split('\n');
        if (lines.length != 2) {
            const errMsg = `Error: while fetching default branch name for repo "${repoPath}"
                we expected to have 2 lines but we got "${output}"
                Command erroring: "${gitCommand}"`;
            throw new git_errors_1.GitError(errMsg, repoPath, gitCommand);
        }
        // we take the first line which we expect to be something like "origin/HEAD -> origin/master"
        const parts = lines[0].split('/');
        if (parts.length !== 3) {
            const errMsg = `Error: while fetching default branch name for repo "${repoPath}"
                we expected to have 3 parts but we got "${output}"
                Command erroring: "${gitCommand}"`;
            throw new git_errors_1.GitError(errMsg, repoPath, gitCommand);
        }
        const branchName = parts[2];
        return branchName;
    }));
}
exports.defaultBranchName$ = defaultBranchName$;
// localAndNonLocalBranches$ is a function that returns an Observable that emits each branch of a Git repository
// considering also the non local branches
function localAndNonLocalBranches$(repoPath, descending = true, options = {}) {
    // build the command to fetch the last branch name
    // git for-each-ref --sort=-committerdate --format='%(refname:short)' refs/heads/ | head -n 1
    const sort = descending ? '-committerdate' : 'committerdate';
    const gitCommand = `cd ${repoPath} &&  git branch -va --sort=${sort}  --format='%(committerdate:local) %(refname:short)'`;
    return (0, execute_command_1.executeCommandObs$)(`fetch last branch name for ${repoPath}`, gitCommand, options).pipe((0, rxjs_1.concatMap)((output) => {
        return (0, rxjs_1.from)(output.split('\n'));
    }), (0, rxjs_1.map)((output) => {
        // example of output:
        // Thu Mar 28 14:11:44 2024 origin/other-stuff
        const branchData = output.trim();
        const parts = branchData.split(' ');
        const branchName = parts[parts.length - 1];
        const branchDateString = parts.slice(0, 5).join(' ');
        const branchDate = new Date(branchDateString);
        return { branchName, branchDate };
    }));
}
exports.localAndNonLocalBranches$ = localAndNonLocalBranches$;
// lastBranch$ is a function that returns an Observable that emits the last branch of a Git repository
// considering also the non local branches
function lastBranch$(repoPath, options = {}) {
    return localAndNonLocalBranches$(repoPath, true, options).pipe((0, rxjs_1.take)(1));
}
exports.lastBranch$ = lastBranch$;
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