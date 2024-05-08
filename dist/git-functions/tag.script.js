"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const tag_1 = require("./tag");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
const path_1 = __importDefault(require("path"));
const repo_path_1 = require("./repo-path");
const reposFolder = '../../temp/pass';
const fromDate = new Date('2023-01-01');
const outDir = './out';
const outFile = 'tags-2023.csv';
const outFilePath = path_1.default.join(outDir, outFile);
(0, rxjs_1.from)((0, repo_path_1.gitRepoPaths)(reposFolder)).pipe((0, rxjs_1.mergeMap)(repo => {
    return (0, tag_1.readTag$)({ repoFolderPath: repo });
}), (0, rxjs_1.filter)(tag => new Date(tag.date) > fromDate), (0, rxjs_1.map)(tag => {
    var _a, _b;
    const tagName = tag.tagName;
    // extract the release number from the tag name
    const releaseNumber = (_b = (_a = tagName.match(/\d+\.\d+\.\d+/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : '-';
    // the area is the first directory name in the repo path after the reposFolder
    const _reposFolder = reposFolder.endsWith(path_1.default.sep) ? reposFolder : reposFolder + path_1.default.sep;
    const repoPathParts = tag.repoPath.split(_reposFolder);
    const repoPathAfterReposFolder = repoPathParts[1];
    const area = repoPathAfterReposFolder.split(path_1.default.sep)[0];
    const repo = repoPathAfterReposFolder.slice(area.length + 1);
    return Object.assign(Object.assign({}, tag), { releaseNumber, area, repo });
}), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(records => {
    return (0, observable_fs_1.writeFileObs)(outFilePath, records);
})).subscribe({
    complete: () => {
        console.log(`Tags written to ${outFilePath}`);
    }
});
//# sourceMappingURL=tag.script.js.map