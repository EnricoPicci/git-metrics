"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noneOfStringsPresent = void 0;
function noneOfStringsPresent(stringsToCheck, rec, fieldName) {
    // Return true if none of the stringsToCheck appear in the field fieldName of the record rec
    const inputString = rec[fieldName];
    return !stringsToCheck.some(str => inputString.includes(str));
}
exports.noneOfStringsPresent = noneOfStringsPresent;
//# sourceMappingURL=none-of-strings-present.js.map