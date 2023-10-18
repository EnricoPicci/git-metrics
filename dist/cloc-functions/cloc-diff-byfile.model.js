"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newClocDiffByfile = void 0;
const path_1 = __importDefault(require("path"));
function newClocDiffByfile(csvLine) {
    const fields = csvLine.split(',');
    const file = fields[0];
    let extension = path_1.default.extname(file);
    extension = extension.replace('.', '');
    const blank_same = parseInt(fields[1]);
    const blank_modified = parseInt(fields[2]);
    const blank_added = parseInt(fields[3]);
    const blank_removed = parseInt(fields[4]);
    const comment_same = parseInt(fields[5]);
    const comment_modified = parseInt(fields[6]);
    const comment_added = parseInt(fields[7]);
    const comment_removed = parseInt(fields[8]);
    const code_same = parseInt(fields[9]);
    const code_modified = parseInt(fields[10]);
    const code_added = parseInt(fields[11]);
    const code_removed = parseInt(fields[12]);
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
//# sourceMappingURL=cloc-diff-byfile.model.js.map