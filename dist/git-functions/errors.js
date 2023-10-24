"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_UNKNOWN_REVISION_OR_PATH = exports.isUnknownRevisionError = void 0;
function isUnknownRevisionError(error) {
    return error.message.includes('unknown revision or path not in the working tree');
}
exports.isUnknownRevisionError = isUnknownRevisionError;
exports.ERROR_UNKNOWN_REVISION_OR_PATH = {
    name: 'ErrorUnknownParent',
    message: 'Unknown revision or path - not in the working tree',
};
//# sourceMappingURL=errors.js.map