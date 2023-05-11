"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newModuleChurn = void 0;
function newModuleChurn(path) {
    const mChurn = {
        path,
        depth: 0,
        cloc: 0,
        numChurnedFiles: 0,
        linesAddDel: 0,
        linesAdded: 0,
        linesDeleted: 0,
        cloc_own: 0,
        linesAdded_own: 0,
        linesDeleted_own: 0,
        linesAddDel_own: 0,
        created: undefined,
    };
    mChurn.depth = path.split('/').length - 1;
    return mChurn;
}
exports.newModuleChurn = newModuleChurn;
//# sourceMappingURL=module-churn.js.map