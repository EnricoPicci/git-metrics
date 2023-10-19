"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile$ = void 0;
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
function deleteFile$(filePath, ignoreIfNotExisting = true) {
    return (0, observable_fs_1.deleteFileObs)(filePath).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT' && ignoreIfNotExisting) {
            // complete so that the next operation can continue
            return (0, rxjs_1.of)(null);
        }
        throw new Error(err);
    }));
}
exports.deleteFile$ = deleteFile$;
//# sourceMappingURL=delete-file-ignore-if-missing.js.map