import path from "path";

export function buildOutfileName(outFile: string, outFilePrefix?: string, repoFolder?: string, postfix?: string) {
    const repoFolderName = path.parse(repoFolder!).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolder = isCurrentFolder ? path.parse(process.cwd()).name : repoFolder!;
    const _prefix = outFilePrefix ?? '';
    return outFile ? outFile : `${_prefix}${path.parse(_repoFolder).name}${postfix}`;
}