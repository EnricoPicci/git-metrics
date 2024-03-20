import path from "path";

export function calcArea(repoPath: string, reposFolderPath: string) {
    // area is the first folder in the repo path after removing reposFolderPath
    // first remove the trailing path separator if any and the leading path separator if any
    repoPath = repoPath.trim()
    reposFolderPath = reposFolderPath.trim()

    let _reposPathNormalized = repoPath.startsWith(`.${path.sep}`) ? repoPath.substring(2) : repoPath
    _reposPathNormalized = _reposPathNormalized.startsWith(path.sep) ? _reposPathNormalized.substring(1) : _reposPathNormalized
    let _reposFolderPathNormalized = reposFolderPath.startsWith(`.${path.sep}`) ? reposFolderPath.substring(2) : reposFolderPath
    _reposFolderPathNormalized = _reposFolderPathNormalized.startsWith(path.sep) ? _reposFolderPathNormalized.substring(1) : _reposFolderPathNormalized

    _reposPathNormalized = _reposPathNormalized.endsWith(path.sep) ?
        _reposPathNormalized.substring(0, _reposPathNormalized.length - 1) :
        _reposPathNormalized
    _reposFolderPathNormalized = _reposFolderPathNormalized.endsWith(path.sep) ?
        _reposFolderPathNormalized.substring(0, _reposFolderPathNormalized.length - 1) :
        _reposFolderPathNormalized

    if (_reposFolderPathNormalized.trim() && !_reposPathNormalized.startsWith(_reposFolderPathNormalized)) {
        throw new Error(`The repo path ${repoPath} seems not to be in the repos folder path ${reposFolderPath}`)
    }

    // if repoPath and repoFolderpath are the same then there is no concept of area and we return an empty string
    if (_reposPathNormalized === _reposFolderPathNormalized) {
        return ''
    }

    // if the reposFolderPath is empty (after normalization, which means it could be . or ./) then the area is the first folder in the repo path
    if (!_reposFolderPathNormalized) {
        const repoPathParts = _reposPathNormalized.split(path.sep)
        return repoPathParts[0]
    }

    const repoPathParts = _reposPathNormalized.split(_reposFolderPathNormalized)
    const splitRepoPath = repoPathParts[1].split(path.sep);
    return splitRepoPath[1];
}