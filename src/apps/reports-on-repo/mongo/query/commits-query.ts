import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { connectObs, findObs } from 'observable-mongo';
import { CommitWithFileNumstats } from "../../../../git-functions/commit.model";
// ============================ READ THE COMMITS ================================
// read the commits collection
export function commits(connectionString: string, dbName: string, commitsCollection: string, after?: Date) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the commits
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection<CommitWithFileNumstats>(commitsCollection);
            const queryCondition = after ? { authorDate: { $gte: after } } : {};
            return findObs(coll, queryCondition) as Observable<CommitWithFileNumstats>;
        }),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            complete: () => {
                console.log(`====>>>> Commits read from ${dbName}.${commitsCollection}`);
            },
        }),
    );
}
