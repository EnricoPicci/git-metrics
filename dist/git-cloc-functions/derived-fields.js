"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcArea = void 0;
const path_1 = __importDefault(require("path"));
function calcArea(repoPath, reposFolderPath) {
    // area is the first folder in the repo path after removing reposFolderPath
    // first remove the trailing path separator if any and the leading path separator if any
    repoPath = repoPath.trim();
    reposFolderPath = reposFolderPath.trim();
    let _reposPathNormalized = repoPath.startsWith(`.${path_1.default.sep}`) ? repoPath.substring(2) : repoPath;
    _reposPathNormalized = _reposPathNormalized.startsWith(path_1.default.sep) ? _reposPathNormalized.substring(1) : _reposPathNormalized;
    let _reposFolderPathNormalized = reposFolderPath.startsWith(`.${path_1.default.sep}`) ? reposFolderPath.substring(2) : reposFolderPath;
    _reposFolderPathNormalized = _reposFolderPathNormalized.startsWith(path_1.default.sep) ? _reposFolderPathNormalized.substring(1) : _reposFolderPathNormalized;
    _reposPathNormalized = _reposPathNormalized.endsWith(path_1.default.sep) ?
        _reposPathNormalized.substring(0, _reposPathNormalized.length - 1) :
        _reposPathNormalized;
    _reposFolderPathNormalized = _reposFolderPathNormalized.endsWith(path_1.default.sep) ?
        _reposFolderPathNormalized.substring(0, _reposFolderPathNormalized.length - 1) :
        _reposFolderPathNormalized;
    if (_reposFolderPathNormalized.trim() && !_reposPathNormalized.startsWith(_reposFolderPathNormalized)) {
        throw new Error(`The repo path ${repoPath} seems not to be in the repos folder path ${reposFolderPath}`);
    }
    // if repoPath and repoFolderpath are the same then there is no concept of area and we return an empty string
    if (_reposPathNormalized === _reposFolderPathNormalized) {
        return '';
    }
    // if the reposFolderPath is empty (after normalization, which means it could be . or ./) then the area is the first folder in the repo path
    if (!_reposFolderPathNormalized) {
        const repoPathParts = _reposPathNormalized.split(path_1.default.sep);
        return repoPathParts[0];
    }
    const repoPathParts = _reposPathNormalized.split(_reposFolderPathNormalized);
    const splitRepoPath = repoPathParts[1].split(path_1.default.sep);
    return splitRepoPath[1];
}
exports.calcArea = calcArea;
//# sourceMappingURL=derived-fields.js.map