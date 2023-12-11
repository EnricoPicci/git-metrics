"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allJavaFiles = void 0;
const files_1 = require("../fs-functions/files");
/**
 * Fetches all Java files from a directory and its subdirectories and returns an Observable that emits
 * each Java file path along with its repository path.
 * @param fromDirPath The path to the directory to fetch the Java files from.
 * @returns An Observable that emits an object for each Java file. The object contains the repository path and the Java file path.
 */
function allJavaFiles(fromDirPath, excludeRepoPaths) {
    return (0, files_1.allFilesWithRepos$)(fromDirPath, '.java', excludeRepoPaths);
}
exports.allJavaFiles = allJavaFiles;
//# sourceMappingURL=java-files.js.map