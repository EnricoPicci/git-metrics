"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentTimestampYYYYMMDDhhmmss = void 0;
function currentTimestampYYYYMMDDhhmmss() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
exports.currentTimestampYYYYMMDDhhmmss = currentTimestampYYYYMMDDhhmmss;
//# sourceMappingURL=timestamp.js.map