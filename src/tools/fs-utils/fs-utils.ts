import fs from "fs";


export function createDirIfNotExisting(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}
