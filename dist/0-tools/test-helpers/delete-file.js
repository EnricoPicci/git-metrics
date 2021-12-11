"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = void 0;
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
function deleteFile(file) {
    return (0, observable_fs_1.deleteFileObs)(file).pipe((0, rxjs_1.catchError)((err) => {
        if (err.code === 'ENOENT') {
            return (0, rxjs_1.of)(null);
        }
    }));
}
exports.deleteFile = deleteFile;
//# sourceMappingURL=delete-file.js.map