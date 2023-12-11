"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.javaPackageMember$ = exports.allJavaPackageMembersDict$ = exports.javaPackage$ = exports.allJavaPackagesDict$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const java_files_1 = require("./java-files");
/**
 * Calculates all Java packages defined by all java files contained in a directory and its subdirectories
 * and returns an Observable that emits an dictionary of all packages found. The dictionary is an object
 * containing each package name as property whose value is an object containing the repository path and the directory
 * of such package.
 * @param fromDirPath The path to the directory to fetch the Java packages from.
 * @returns An Observable that emits a dictionary whose keys are the packages and values are the repository path and directory name
 * of that package.
 * @throws A warning if a Java file does not contain a line starting with "package ".
 */
function allJavaPackagesDict$(fromDirPath, excludeRepoPaths) {
    const dirs = {};
    const errors = [];
    return (0, java_files_1.allJavaFiles)(fromDirPath, excludeRepoPaths).pipe((0, rxjs_1.filter)(({ javaFile }) => {
        const dirPath = path_1.default.dirname(javaFile);
        if (dirs[dirPath]) {
            return false;
        }
        dirs[dirPath] = dirPath;
        return true;
    }), 
    // map the java file to the package name
    (0, rxjs_1.concatMap)(({ javaFile, repoPath }) => {
        const dirPath = path_1.default.dirname(javaFile);
        const dirName = dirPath.slice(repoPath.length + 1);
        return javaPackage$(javaFile, errors).pipe((0, rxjs_1.map)((packageNameOrError) => ({ packageNameOrError, repoPath, dirName })));
    }), (0, rxjs_1.reduce)((dict, { packageNameOrError, repoPath, dirName }) => {
        if (packageNameOrError instanceof Error) {
            return dict;
        }
        const packageName = packageNameOrError; // if we reach this point, packageNameOrError is a string representing the package name  
        if (dict[packageName] && dict[packageName].repoPath !== repoPath) {
            console.warn(`Warning: package "${packageName}" is defined in multiple repos - (${repoPath})`);
            const _packageName = `${packageName} (${repoPath})`;
            dict[_packageName] = { repoPath, dirName };
            return dict;
        }
        dict[packageName] = { repoPath, dirName };
        return dict;
    }, {}));
}
exports.allJavaPackagesDict$ = allJavaPackagesDict$;
/**
 * Reads a Java file, finds the line that starts with "package ", and returns an Observable that emits the package name.
 * If the Java file does not contain a line starting with "package ",
 * the Observable emits undefined and a warning is logged to the console.
 * @param javaFile The path to the Java file to read.
 * @returns An Observable that emits the package name.
 */
function javaPackage$(javaFile, errors) {
    // read the java file, find the line that starts with package and return the package name
    return (0, observable_fs_1.readLineObs)(javaFile).pipe((0, rxjs_1.find)((line) => line.startsWith('package ')), (0, rxjs_1.map)((line) => {
        if (!line) {
            const err = newNoPackageInFileError(javaFile);
            errors.push(err);
            return err;
        }
        const packageName = line.slice(8, -1);
        return packageName;
    }));
}
exports.javaPackage$ = javaPackage$;
// define a function that returns a dictionary of all package members defined in a directory and its subdirectories
// the dictionary is an object containing each package member name as property whose value is an object
// containing the repository path, the directory name, and the java file path of such package member
// if a member is defined more than once, throw an error
function allJavaPackageMembersDict$(fromDirPath, excludeRepoPaths) {
    const errors = [];
    return (0, java_files_1.allJavaFiles)(fromDirPath, excludeRepoPaths).pipe((0, rxjs_1.concatMap)(({ javaFile, repoPath }) => {
        const repoArea = path_1.default.dirname(repoPath).split(fromDirPath)[1];
        return javaPackageMember$(javaFile, errors).pipe((0, rxjs_1.map)((memberOrError) => ({ memberOrError, repoArea, repoPath, javaFile })));
    }), (0, rxjs_1.reduce)(({ packageMemberDict, packageMemberErrors }, { memberOrError, repoArea, repoPath, javaFile }) => {
        if (memberOrError instanceof Error) {
            packageMemberErrors.push({ error: memberOrError, repoPath, javaFile });
            return { packageMemberDict, packageMemberErrors };
        }
        const packageMemberName = memberOrError; // if we reach this point, memberOrError is a string representing the package member name
        if (packageMemberDict[packageMemberName] && packageMemberDict[packageMemberName].repoPath !== repoPath) {
            const err = newMemberDefinedInMoreThanOneFileError(packageMemberDict[packageMemberName].javaFile, javaFile, packageMemberName);
            packageMemberErrors.push({ error: err, repoPath, javaFile });
            return { packageMemberDict, packageMemberErrors };
        }
        packageMemberDict[packageMemberName] = { repoArea, repoPath, javaFile };
        return { packageMemberDict, packageMemberErrors };
    }, newAllJavaPackageMembersDict()));
}
exports.allJavaPackageMembersDict$ = allJavaPackageMembersDict$;
function newAllJavaPackageMembersDict() {
    return { packageMemberDict: {}, packageMemberErrors: [] };
}
// write a function that returns a the qualified name of a java package member in a java file
function javaPackageMember$(javaFile, errors) {
    // read the java file, find the line that starts with package and return the package name
    return javaPackage$(javaFile, errors).pipe((0, rxjs_1.concatMap)((packageName) => {
        return (0, observable_fs_1.readLineObs)(javaFile).pipe((0, rxjs_1.find)((line) => line.startsWith('public ')), (0, rxjs_1.map)((line) => {
            if (!line) {
                const err = newNoPublicClassOrInterfaceOrEnumError(javaFile);
                errors.push(err);
                return err;
            }
            const trimmedLine = line.trim();
            const parts = trimmedLine.split(' ');
            const partsLength = parts.length;
            if (partsLength < 3) {
                const err = newNoPublicClassOrInterfaceOrEnumError(javaFile);
                errors.push(err);
                return err;
            }
            let memberName;
            const secondPart = parts[1];
            if (secondPart === 'class' || secondPart === 'interface' || secondPart === 'enum' || secondPart === '@interface') {
                memberName = parts[2];
            }
            else {
                if (partsLength < 4) {
                    const err = newNoPublicClassOrInterfaceOrEnumError(javaFile);
                    errors.push(err);
                    return err;
                }
                memberName = parts[3];
            }
            return `${packageName}.${memberName}`;
        }));
    }), (0, rxjs_1.filter)((packageMemberName) => packageMemberName !== ''));
}
exports.javaPackageMember$ = javaPackageMember$;
function newNoPublicClassOrInterfaceOrEnumError(javaFile) {
    const err = new Error(`Java file "${javaFile}" does not contain a public class or interface or enum`);
    err.name = 'NoPublicClassOrInterfaceOrEnumError';
    return err;
}
function newMemberDefinedInMoreThanOneFileError(javaFile_1, javaFile_2, packageMemberName) {
    const err = new Error(`Package member "${packageMemberName}" is defined in multiple java files: ${javaFile_1} ${javaFile_2}`);
    err.name = 'MemberDefinedInMoreThanOneFileError';
    return err;
}
function newNoPackageInFileError(javaFile) {
    const err = new Error(`Warning: while reading file "${javaFile}" we did not find a line starting with "package "`);
    err.name = 'NoPackageInFileError';
    return err;
}
//# sourceMappingURL=packages.js.map