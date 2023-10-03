"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTagsCommand = exports.SEP = exports.readTags = void 0;
const path_1 = __importDefault(require("path"));
const execute_command_1 = require("../tools/execute-command/execute-command");
const config_1 = require("./config");
const file_name_utils_1 = require("./utils/file-name-utils");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
/**
 * Reads the tags from a Git repository and logs a message to the console indicating the folder where
 * the tags were read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readTagsCommand` function.
 * @returns The path to the file where the output was saved.
 */
function readTags(config) {
    const [cmd, out] = readTagsCommand(config);
    (0, execute_command_1.executeCommand)('readTags', cmd);
    console.log(`====>>>> Tags read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.readTags = readTags;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
exports.SEP = config_1.GIT_CONFIG.COMMIT_REC_SEP;
function readTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = (0, file_name_utils_1.buildOutfileName)(config.outFile, repoFolder, '', '-tags.log');
    const out = path_1.default.resolve(path_1.default.join(outDir, outFile));
    return [`git ${repoFolder} log --no-walk --tags --pretty='${exports.SEP}%h${exports.SEP}%d${exports.SEP}%s' --decorate=full > ${out}`, out];
}
exports.readTagsCommand = readTagsCommand;
//# sourceMappingURL=tag.functions.js.map