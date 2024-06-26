"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDirIfNotExisting = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * Creates a directory at the specified path if it does not already exist.
 * @param path The path to the directory to create.
 */
function createDirIfNotExisting(path) {
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.mkdirSync(path);
    }
}
exports.createDirIfNotExisting = createDirIfNotExisting;
//# sourceMappingURL=fs-utils.js.map