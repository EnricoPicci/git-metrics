import path from 'path';
import { forkJoin } from 'rxjs';
import { loadAllCommitsFiles } from './load-commits-files';

// ============================ LOAD ALL COMMITS AND FILES FOR ALL REPOs PASSED IN AS PARAMETERS================================
// Loads the commit and files info as documents into a mongodb.

export function loadMultiAllCommitsFiles(
    connectionString: string,
    commitLogPaths: string[],
    clocLogPaths: string[],
    dbName?: string,
    commitsCollectionPrefix?: string,
    bufferSize = 1,
    logProgress?: boolean,
    mongoConcurrency?: number,
) {
    if (commitLogPaths.length !== clocLogPaths.length) {
        throw new Error(
            `The number of files containing commits (${commitLogPaths.length}) is not the same as the number of files containing cloc info (${clocLogPaths.length})`,
        );
    }
    const loadObservables = commitLogPaths.map((commitLogPath, i) => {
        const clocLogPath = clocLogPaths[i];
        const commitLogName = path.parse(commitLogPath).name;
        const _commitsCollectionPrefix = commitsCollectionPrefix ?? '';
        const commitsCollection = `${_commitsCollectionPrefix}${commitLogName}`;
        return loadAllCommitsFiles(
            commitLogPath,
            connectionString,
            dbName,
            commitsCollection,
            bufferSize,
            clocLogPath,
            logProgress,
            mongoConcurrency,
        );
    });
    return forkJoin(loadObservables);
}
