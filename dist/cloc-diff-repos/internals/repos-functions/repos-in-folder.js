"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reposInFolder = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
// reposInFolder returns the list of git repos paths in a given folder
function reposInFolder(folderPath) {
    let gitRepos = [];
    const filesAndDirs = fs.readdirSync(folderPath);
    if (filesAndDirs.some(fileOrDir => fileOrDir === '.git')) {
        gitRepos.push(folderPath);
    }
    filesAndDirs.forEach(fileOrDir => {
        const absolutePath = path_1.default.join(folderPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepos = reposInFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}
exports.reposInFolder = reposInFolder;
//# sourceMappingURL=repos-in-folder.js.map