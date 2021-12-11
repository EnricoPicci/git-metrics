import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

import { FileChurn } from '../1-C-aggregate-types/file-churn';
import { ModuleChurn, newModuleChurn } from '../1-C-aggregate-types/module-churn';
import { splitPath } from '../0-tools/split-path/split-path';

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
    const pathFolders = foldersInPathForFile(file.path);
    const modules = pathFolders.reduce((acc, val, i) => {
        if (acc.length === 0) {
            acc.push(val);
        } else {
            const next = `${acc[i - 1]}/${val}`;
            acc.push(next);
        }
        return acc;
    }, [] as string[]);
    modules.forEach((m) => {
        if (!modulesDict[m]) {
            modulesDict[m] = newModuleChurn(m);
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
function foldersInPathForFile(filePath: string) {
    const pathElements = splitPath(filePath);
    // the folders are all the elements of the path with the exclusion of the last one which is the file name
    const folders = pathElements.slice(0, pathElements.length - 1);
    // if the file is in the root of the repo, we return the symbol .
    return folders.length === 0 ? ['.'] : ['.', ...folders];
}
