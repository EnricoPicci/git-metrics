"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneProject = exports.readProject = void 0;
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
const repo_functions_1 = require("../git-functions/repo.functions");
const path_1 = __importDefault(require("path"));
function readProject(gitLabUrl, token, projectId) {
    const command = `https://${gitLabUrl}/api/v4/projects/${projectId}`;
    return (0, rxjs_1.from)(axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe((0, rxjs_1.map)(resp => {
        return resp.data;
    }));
}
exports.readProject = readProject;
function cloneProject(project, outdir) {
    const url = project.ssh_url_to_repo;
    const name = project.name_with_namespace;
    if (!url)
        throw new Error(`No url for repo ${JSON.stringify(project, null, 2)}`);
    if (!name)
        throw new Error(`No name for repo ${url}`);
    const directory = dirFromNameWithNameSpace(name);
    const outDirPath = path_1.default.join(outdir, directory);
    return (0, repo_functions_1.cloneRepo)(project.ssh_url_to_repo, outDirPath, project.name);
}
exports.cloneProject = cloneProject;
function dirFromNameWithNameSpace(pathParts) {
    return pathParts.split(' / ').join(path_1.default.sep);
}
//# sourceMappingURL=project.functions.js.map