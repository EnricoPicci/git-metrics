import fs from "fs";

/**
 * Creates a directory at the specified path if it does not already exist.
 * @param path The path to the directory to create.
 */
export function createDirIfNotExisting(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}
