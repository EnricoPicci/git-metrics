"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleChurns = exports.ROOT_DIR_SYMBOL_BACKSLASH = exports.ROOT_DIR_SYMBOL = void 0;
const operators_1 = require("rxjs/operators");
const module_churn_1 = require("../1-C-aggregate-types/module-churn");
const path_1 = __importDefault(require("path"));
const split_path_1 = require("../../../tools/split-path/split-path");
exports.ROOT_DIR_SYMBOL = '.';
// exported for testing purposes only
exports.ROOT_DIR_SYMBOL_BACKSLASH = exports.ROOT_DIR_SYMBOL + '/';
function moduleChurns(fileChurns) {
    return _moduleChurns(fileChurns).pipe((0, operators_1.map)((modulesDict) => {
        return Object.values(modulesDict);
    }));
}
exports.moduleChurns = moduleChurns;
function _moduleChurns(fileChurns) {
    const modulesDict = {};
    return fileChurns.pipe((0, operators_1.map)((_fileChurns) => _fileChurns.reduce((acc, fileChurn) => {
        acc = fillModulesDict(fileChurn, acc);
        return acc;
    }, modulesDict)), (0, operators_1.share)());
}
function fillModulesDict(file, modulesDict) {
    const modules = foldersInPath(file.path);
    modules.forEach((m) => {
        if (!modulesDict[m]) {
            modulesDict[m] = (0, module_churn_1.newModuleChurn)(m);
        }
        Object.keys(modulesDict).forEach((k) => {
            if (k === m) {
                modulesDict[k].numChurnedFiles++;
                modulesDict[k].cloc = modulesDict[k].cloc + file.cloc;
                modulesDict[k].created =
                    !modulesDict[k].created || file.created < modulesDict[k].created
                        ? file.created
                        : modulesDict[k].created;
                modulesDict[k].linesAddDel = modulesDict[k].linesAddDel + file.linesAddDel;
                modulesDict[k].linesAdded = modulesDict[k].linesAdded + file.linesAdded;
                modulesDict[k].linesDeleted = modulesDict[k].linesDeleted + file.linesDeleted;
                // if the file is in the root of the module, we add the lines to the own lines
                const fileFolder = exports.ROOT_DIR_SYMBOL_BACKSLASH + path_1.default.dirname(file.path);
                if (fileFolder === m) {
                    modulesDict[k].cloc_own = modulesDict[k].cloc_own + file.cloc;
                    modulesDict[k].linesAddDel_own = modulesDict[k].linesAddDel_own + file.linesAddDel;
                    modulesDict[k].linesAdded_own = modulesDict[k].linesAdded_own + file.linesAdded;
                    modulesDict[k].linesDeleted_own = modulesDict[k].linesDeleted_own + file.linesDeleted;
                }
            }
        });
    });
    return modulesDict;
}
function foldersInPath(filePath) {
    const pathElements = (0, split_path_1.splitPath)(filePath);
    // the folders are all the elements of the path with the exclusion of the last one which is the file name
    let folders = pathElements.slice(0, pathElements.length - 1);
    // if the file is in the root of the repo, we return the symbol .
    folders = folders.length === 0 ? [exports.ROOT_DIR_SYMBOL] : [exports.ROOT_DIR_SYMBOL, ...folders];
    return folders.reduce((acc, val, i) => {
        if (acc.length === 0) {
            acc.push(val);
        }
        else {
            const next = `${acc[i - 1]}/${val}`;
            acc.push(next);
        }
        return acc;
    }, []);
}
//# sourceMappingURL=module-churn-aggregate.js.map