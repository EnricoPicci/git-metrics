import { concatMap, map } from 'rxjs/operators';
import { loadAllCommits } from './load-commits';
import { calculateAddCreationDateToFiles, loadAllFiles } from './load-files';

// ============================ LOAD ALL COMMITS AND FILES ================================
// Loads the commit and files info as documents into a mongo collection.
// Notifies ONLY ONCE an object with connString, dbName, collection names, number of objects loaded when the load operation is completed.
// bufferSize defines the size of the buffer.

export function loadAllCommitsFiles(
    commitLogPath: string,
    connectionString: string,
    dbName?: string,
    commitsCollection?: string,
    bufferSize = 1,
    clocLogPath?: string,
    logProgress?: boolean,
    mongoConcurrency?: number,
) {
    return loadAllCommits(
        commitLogPath,
        connectionString,
        dbName,
        commitsCollection,
        bufferSize,
        clocLogPath,
        logProgress,
        mongoConcurrency,
    ).pipe(
        concatMap(({ connectionString, dbName, commitsCollection, numberOfCommitsLoaded }) =>
            // then load all files
            loadAllFiles(connectionString, dbName, commitsCollection, bufferSize, logProgress, mongoConcurrency).pipe(
                map((resp) => ({ ...resp, commitsCollection, numberOfCommitsLoaded })),
            ),
        ),
        concatMap(
            ({
                connectionString,
                dbName,
                filesCollection,
                numberOfFilesLoaded,
                commitsCollection,
                numberOfCommitsLoaded,
            }) =>
                // then calculate and add the creation dates
                calculateAddCreationDateToFiles(connectionString, dbName, filesCollection, mongoConcurrency).pipe(
                    map((resp) => ({ ...resp, numberOfFilesLoaded, commitsCollection, numberOfCommitsLoaded })),
                ),
        ),
    );
}
