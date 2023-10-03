import path from "path";

export function buildOutfileName(outFile: string, repoFolder?: string, outFilePrefix?: string, postfix?: string) {
    const _repoFolder = repoFolder ? repoFolder : process.cwd();
    const repoFolderName = path.parse(_repoFolder).name
    const _prefix = outFilePrefix ?? '';
    return outFile ? outFile : `${_prefix}${path.parse(repoFolderName).name}${postfix}`;
}