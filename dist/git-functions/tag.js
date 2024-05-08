"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTagsCommand = exports.readTagsCommand = exports.writeTags = exports.readTag$ = exports.readTags$ = exports.SEP = void 0;
const path_1 = __importDefault(require("path"));
const execute_command_1 = require("../tools/execute-command/execute-command");
const config_1 = require("./config");
const file_name_utils_1 = require("./utils/file-name-utils");
const rxjs_1 = require("rxjs");
exports.SEP = config_1.GIT_CONFIG.COMMIT_REC_SEP;
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
function readTags$(config) {
    const cmd = readTagsCommand(config);
    return (0, execute_command_1.executeCommandObs$)('readTags', cmd).pipe((0, rxjs_1.map)((out) => {
        return out.split('\n').filter((line) => line.trim().length > 0);
    }));
}
exports.readTags$ = readTags$;
function readTag$(config) {
    return readTags$(config).pipe((0, rxjs_1.concatMap)((tags) => tags), (0, rxjs_1.map)((tagString) => {
        var _a;
        const [hash, _tagName, _commitSubject, date] = tagString.split(exports.SEP);
        if (hash === '2a70da7c') {
            console.log('tagString', tagString);
        }
        const tagName = _tagName.replaceAll(',', ' - ');
        const commitSubject = _commitSubject.replaceAll(',', ' - ');
        const repoPath = (_a = config.repoFolderPath) !== null && _a !== void 0 ? _a : '';
        const tag = { hash, tagName, commitSubject, repoPath, date };
        return tag;
    }));
}
exports.readTag$ = readTag$;
/**
 * Reads the tags from a Git repository and logs a message to the console indicating the folder where
 * the tags were read from and the file where the output was saved.
 * @param config An object containing the parameters to pass to the `readTagsCommand` function.
 * @returns The path to the file where the output was saved.
 */
function writeTags(config) {
    const [cmd, out] = writeTagsCommand(config);
    (0, execute_command_1.executeCommand)('writeTags', cmd);
    console.log(`====>>>> Tags read from repo in folder ${config.repoFolderPath ? config.repoFolderPath : path_1.default.parse(process.cwd()).name}`);
    console.log(`====>>>> Output saved on file ${out}`);
    return out;
}
exports.writeTags = writeTags;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
function readTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    return `git ${repoFolder} log --no-walk --tags --pretty='%h${exports.SEP}%d${exports.SEP}%s${exports.SEP}%ai' --decorate=full`;
}
exports.readTagsCommand = readTagsCommand;
function writeTagsCommand(config) {
    const repoFolder = config.repoFolderPath ? `-C ${config.repoFolderPath}` : '';
    const outDir = config.outDir ? config.outDir : './';
    const outFile = (0, file_name_utils_1.buildOutfileName)(config.outFile, repoFolder, '', '-tags.log');
    const out = path_1.default.resolve(path_1.default.join(outDir, outFile));
    return [`${readTagsCommand(config)} > ${out}`, out];
}
exports.writeTagsCommand = writeTagsCommand;
//# sourceMappingURL=tag.js.map