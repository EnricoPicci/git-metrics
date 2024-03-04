"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAllImportsForFilesWithRepoInfo$ = exports.allImportsForFilesWithRepoInfo$ = exports.allImportsForFiles$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const java_files_1 = require("./java-files");
const packages_1 = require("./packages");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const delete_file_ignore_if_missing_1 = require("../tools/observable-fs-extensions/delete-file-ignore-if-missing");
const fs_utils_1 = require("../tools/fs-utils/fs-utils");
/**
 * Fetches all imported packages for all Java files from a directory and its subdirectories and returns an Observable
 * that emits an object containing each imported package name along with the repository path, directory name, Java file path,
 * and the name of the package to which the Java file belongs (the importing package).
 * @param fromDirPath The path to the directory to fetch the Java files from.
 * @param excludeRepoPaths An optional array of repository paths to exclude.
 * @returns An Observable that emits an object containing each imported package name along with the repository path,
 * directory name, Java file path, and the name of the package to which the Java file belongs (the importing package).
 * @throws An error if an imported package member does not contain a dot.
 */
function allImportsForFiles$(fromDirPath, excludeRepoPaths) {
    const errors = [];
    return (0, java_files_1.allJavaFiles)(fromDirPath, excludeRepoPaths).pipe((0, rxjs_1.concatMap)(({ javaFile, repoPath }) => {
        const importingRepo = repoPath.split(fromDirPath)[1];
        const importingFile = javaFile.split(fromDirPath)[1];
        const importingRepoArea = path_1.default.dirname(importingRepo).split(fromDirPath)[1];
        return (0, packages_1.javaPackage$)(javaFile, errors).pipe((0, rxjs_1.map)((importingPackage) => ({ importingRepoArea, importingRepo, importingPackage, importingFile, repoPath, javaFile })));
    }), (0, rxjs_1.concatMap)(({ importingPackage, importingRepo, importingFile, javaFile, repoPath }) => {
        const dirPath = path_1.default.dirname(javaFile);
        const dirName = dirPath.slice(repoPath.length + 1);
        // read the java file, filter the lines that start with "import " or "import static " 
        // and return a stream of objects containing the repository path, directory name, java file path
        // the name of the package to which the java file belongs (the importing package) and imported package name
        return (0, observable_fs_1.readLineObs)(javaFile).pipe((0, rxjs_1.filter)((line) => {
            const trimmedLine = line.trim();
            return trimmedLine.startsWith('import ') ||
                trimmedLine.startsWith('import static ');
        }), (0, rxjs_1.map)((line) => {
            const importedPackageMember = line.slice(7, -1).trim();
            if (importedPackageMember.length === 0) {
                throw new Error(`Import statement in file "${javaFile}" is empty`);
            }
            return importedPackageMember;
        }), 
        // reduce all the imported packages to a set
        (0, rxjs_1.reduce)((set, importedPackageMember) => {
            set.add(importedPackageMember);
            return set;
        }, new Set()), 
        // convert the set to an array
        (0, rxjs_1.map)((set) => Array.from(set).map((importedPackageMember) => ({ repoPath, dirName, javaFile, importingRepo, importingPackage, importingFile, importedPackageMember }))), 
        // flatten the array of objects 
        (0, rxjs_1.mergeMap)((importObjs) => importObjs));
    }));
}
exports.allImportsForFiles$ = allImportsForFiles$;
function allImportsForFilesWithRepoInfo$(packagMembersDict$, imports$) {
    return packagMembersDict$.pipe((0, rxjs_1.concatMap)(({ packageMemberDict }) => {
        return imports$.pipe((0, rxjs_1.map)((importObj) => {
            let importedRepo = '-';
            let importedJavaFile = '-';
            let importedRepoArea = '-';
            const importedPackageInfo = packageMemberDict[importObj.importedPackageMember];
            if (importedPackageInfo) {
                importedRepo = importedPackageInfo.repoPath;
                importedJavaFile = importedPackageInfo.javaFile;
                importedRepoArea = importedPackageInfo.repoArea;
            }
            return Object.assign(Object.assign({}, importObj), { importedRepoArea, importedRepo, importedJavaFile });
        }));
    }));
}
exports.allImportsForFilesWithRepoInfo$ = allImportsForFilesWithRepoInfo$;
function writeAllImportsForFilesWithRepoInfo$(dirForFiles, dirForPackages, outdir, excludeRepoPaths) {
    // packageMembersDict is shared since it used by two observables: the one that writes the csv file and the one that writes the errors file
    // sharing ensures that the read operations on the files performed by allJavaPackageMembersDict$ are performed only once
    const packageMembersDict$ = (0, packages_1.allJavaPackageMembersDict$)(dirForPackages, excludeRepoPaths).pipe((0, rxjs_1.share)());
    const imports$ = allImportsForFiles$(dirForFiles, excludeRepoPaths);
    const dirForFilesName = path_1.default.basename(dirForFiles);
    const outFilePath = path_1.default.join(outdir, `${dirForFilesName}-all-imports.csv`);
    const writeImportCsv$ = (0, delete_file_ignore_if_missing_1.deleteFile$)(outFilePath).pipe((0, rxjs_1.concatMap)(() => allImportsForFilesWithRepoInfo$(packageMembersDict$, imports$)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        return (0, observable_fs_1.appendFileObs)(outFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(outFilePath), (0, rxjs_1.tap)({
        next: (outFilePath) => {
            console.log(`====>>>> all-imports info saved on file ${outFilePath}`);
        },
    }));
    const errorsFilePath = path_1.default.join(outdir, `${dirForFilesName}-all-imports-errors.csv`);
    (0, fs_utils_1.createDirIfNotExisting)(outdir);
    const writeErrors$ = (0, delete_file_ignore_if_missing_1.deleteFile$)(errorsFilePath).pipe((0, rxjs_1.concatMap)(() => packageMembersDict$), (0, rxjs_1.map)(({ packageMemberErrors }) => packageMemberErrors), (0, rxjs_1.concatMap)(errors => (0, rxjs_1.from)(errors)), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)((line) => {
        return (0, observable_fs_1.appendFileObs)(errorsFilePath, `${line}\n`);
    }), (0, rxjs_1.ignoreElements)(), (0, rxjs_1.defaultIfEmpty)(errorsFilePath), (0, rxjs_1.tap)({
        next: (errorsFilePath) => {
            console.log(`====>>>> all-imports errors saved on file ${errorsFilePath}`);
        },
    }));
    return (0, rxjs_1.merge)(writeImportCsv$, writeErrors$);
}
exports.writeAllImportsForFilesWithRepoInfo$ = writeAllImportsForFilesWithRepoInfo$;
//# sourceMappingURL=imports.js.map