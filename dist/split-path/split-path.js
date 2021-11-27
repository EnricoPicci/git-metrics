"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitPath = void 0;
const path_1 = __importDefault(require("path"));
function splitPath(_path) {
    return _path.split(path_1.default.sep);
}
exports.splitPath = splitPath;
//# sourceMappingURL=split-path.js.map