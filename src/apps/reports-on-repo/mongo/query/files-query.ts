import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { connectObs, findObs } from 'observable-mongo';
import { FileGitCommitEnriched } from '../../1-B-git-enriched-types/git-types';

// ============================ READ THE FILES ================================
// read the files collection
export function files(
    connectionString: string,
    dbName: string,
    filesCollection: string,
    after?: Date,
): Observable<FileGitCommitEnriched> {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the files
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection(filesCollection);
            const queryCondition = after ? { authorDate: { $gte: after } } : {};
            return findObs(coll, queryCondition);
        }),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            complete: () => {
                console.log(`====>>>> Files read from ${dbName}.${filesCollection}`);
            },
        }),
    );
}
