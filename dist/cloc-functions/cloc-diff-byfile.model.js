"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newClocDiffByfileWithSum = exports.newClocDiffByfile = void 0;
const path_1 = __importDefault(require("path"));
function newClocDiffByfile(csvLine) {
    const fields = csvLine.split(',');
    const file = fields[0];
    let extension = path_1.default.extname(file);
    extension = extension.replace('.', '');
    const blank_same = fields[1] ? parseInt(fields[1]) : 0;
    const blank_modified = fields[1] ? parseInt(fields[2]) : 0;
    const blank_added = fields[1] ? parseInt(fields[3]) : 0;
    const blank_removed = fields[1] ? parseInt(fields[4]) : 0;
    const comment_same = fields[1] ? parseInt(fields[5]) : 0;
    const comment_modified = fields[1] ? parseInt(fields[6]) : 0;
    const comment_added = fields[1] ? parseInt(fields[7]) : 0;
    const comment_removed = fields[1] ? parseInt(fields[8]) : 0;
    const code_same = fields[1] ? parseInt(fields[9]) : 0;
    const code_modified = fields[1] ? parseInt(fields[10]) : 0;
    const code_added = fields[1] ? parseInt(fields[11]) : 0;
    const code_removed = fields[1] ? parseInt(fields[12]) : 0;
    const possibleCutPaste = false;
    const clocDiffByfile = {
        file,
        extension,
        blank_same,
        blank_modified,
        blank_added,
        blank_removed,
        comment_same,
        comment_modified,
        comment_added,
        comment_removed,
        code_same,
        code_modified,
        code_added,
        code_removed,
        possibleCutPaste,
    };
    return clocDiffByfile;
}
exports.newClocDiffByfile = newClocDiffByfile;
function newClocDiffByfileWithSum(csvLine) {
    const clocDiffByfile = newClocDiffByfile(csvLine);
    const clocDiffByfileWithSum = Object.assign(Object.assign({}, clocDiffByfile), { sumOfDiffs: undefined });
    return clocDiffByfileWithSum;
}
exports.newClocDiffByfileWithSum = newClocDiffByfileWithSum;
//# sourceMappingURL=cloc-diff-byfile.model.js.map