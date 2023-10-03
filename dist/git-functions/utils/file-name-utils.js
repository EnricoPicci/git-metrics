"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOutfileName = void 0;
const path_1 = __importDefault(require("path"));
function buildOutfileName(outFile, repoFolder, outFilePrefix, postfix) {
    const _repoFolder = repoFolder ? repoFolder : process.cwd();
    const repoFolderName = path_1.default.parse(_repoFolder).name;
    const _prefix = outFilePrefix !== null && outFilePrefix !== void 0 ? outFilePrefix : '';
    return outFile ? outFile : `${_prefix}${path_1.default.parse(repoFolderName).name}${postfix}`;
}
exports.buildOutfileName = buildOutfileName;
//# sourceMappingURL=file-name-utils.js.map