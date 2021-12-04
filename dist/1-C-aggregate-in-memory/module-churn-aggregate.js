"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleChurns = void 0;
const operators_1 = require("rxjs/operators");
const module_churn_1 = require("../1-C-aggregate-types/module-churn");
const split_path_1 = require("../0-tools/split-path/split-path");
function moduleChurns(fileChurns) {
    return _moduleChurns(fileChurns).pipe((0, operators_1.map)((modulesDict) => {
        return Object.values(modulesDict);
    }));
}
exports.moduleChurns = moduleChurns;
function _moduleChurns(fileChurns) {
    const modulesDict = {};
    return fileChurns.pipe((0, operators_1.reduce)((acc, fileChurn) => {
        acc = fillModulesDict(fileChurn, acc);
        return acc;
    }, modulesDict), (0, operators_1.share)());
}
function fillModulesDict(file, modulesDict) {
    const pathFolders = foldersInPathForFile(file.path);
    const modules = pathFolders.reduce((acc, val, i) => {
        if (acc.length === 0) {
            acc.push(val);
        }
        else {
            const next = `${acc[i - 1]}/${val}`;
            acc.push(next);
        }
        return acc;
    }, []);
    modules.forEach((m) => {
        if (!modulesDict[m]) {
            modulesDict[m] = (0, module_churn_1.newModuleChurn)(m);
        }
        Object.keys(modulesDict).forEach((k) => {
            if (k === m) {
                modulesDict[k].numFiles++;
                modulesDict[k].cloc = modulesDict[k].cloc + file.cloc;
                modulesDict[k].created =
                    !modulesDict[k].created || file.created < modulesDict[k].created
                        ? file.created
                        : modulesDict[k].created;
                modulesDict[k].linesAddDel = modulesDict[k].linesAddDel + file.linesAddDel;
                modulesDict[k].linesAdded = modulesDict[k].linesAdded + file.linesAdded;
                modulesDict[k].linesDeleted = modulesDict[k].linesDeleted + file.linesDeleted;
            }
        });
    });
    return modulesDict;
}
function foldersInPathForFile(filePath) {
    const pathElements = (0, split_path_1.splitPath)(filePath);
    // the folders are all the elements of the path with the exclusion of the last one which is the file name
    const folders = pathElements.slice(0, pathElements.length - 1);
    // if the file is in the root of the repo, we return the symbol .
    return folders.length === 0 ? ['.'] : ['.', ...folders];
}
//# sourceMappingURL=module-churn-aggregate.js.map