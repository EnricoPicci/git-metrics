import fs from 'fs'; // in Typescript

export function createDirIfNotExisting(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}
