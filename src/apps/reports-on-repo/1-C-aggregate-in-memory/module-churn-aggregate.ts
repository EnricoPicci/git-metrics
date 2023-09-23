import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

import { FileChurn } from '../1-C-aggregate-types/file-churn';
import { ModuleChurn, newModuleChurn } from '../1-C-aggregate-types/module-churn';
import path from 'path';
import { splitPath } from '../../../tools/split-path/split-path';

export const ROOT_DIR_SYMBOL = '.';
// exported for testing purposes only
export const ROOT_DIR_SYMBOL_BACKSLASH = ROOT_DIR_SYMBOL + '/';

type ModuleChurnDict = {
    [module: string]: ModuleChurn;
};

export function moduleChurns(fileChurns: Observable<FileChurn[]>) {
    return _moduleChurns(fileChurns).pipe(
        map((modulesDict) => {
            return Object.values(modulesDict);
        }),
    );
}

function _moduleChurns(fileChurns: Observable<FileChurn[]>) {
    const modulesDict: ModuleChurnDict = {};
    return fileChurns.pipe(
        map((_fileChurns) =>
            _fileChurns.reduce((acc, fileChurn) => {
                acc = fillModulesDict(fileChurn, acc);
                return acc;
            }, modulesDict),
        ),
        share(),
    );
}

function fillModulesDict(file: FileChurn, modulesDict: ModuleChurnDict) {
    const modules = foldersInPath(file.path);
    modules.forEach((m) => {
        if (!modulesDict[m]) {
            modulesDict[m] = newModuleChurn(m);
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
                const fileFolder = ROOT_DIR_SYMBOL_BACKSLASH + path.dirname(file.path);
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
function foldersInPath(filePath: string) {
    const pathElements = splitPath(filePath);
    // the folders are all the elements of the path with the exclusion of the last one which is the file name
    let folders = pathElements.slice(0, pathElements.length - 1);
    // if the file is in the root of the repo, we return the symbol .
    folders = folders.length === 0 ? [ROOT_DIR_SYMBOL] : [ROOT_DIR_SYMBOL, ...folders];
    return folders.reduce((acc, val, i) => {
        if (acc.length === 0) {
            acc.push(val);
        } else {
            const next = `${acc[i - 1]}/${val}`;
            acc.push(next);
        }
        return acc;
    }, [] as string[]);
}
