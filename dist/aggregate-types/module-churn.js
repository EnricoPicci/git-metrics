"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newModuleChurn = void 0;
function newModuleChurn(path) {
    const mChurn = {
        path,
        cloc: 0,
        numFiles: 0,
        linesAddDel: 0,
        linesAdded: 0,
        linesDeleted: 0,
        created: undefined,
    };
    return mChurn;
}
exports.newModuleChurn = newModuleChurn;
//# sourceMappingURL=module-churn.js.map