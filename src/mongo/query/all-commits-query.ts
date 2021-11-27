import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { aggregateObs, connectObs } from 'observable-mongo';
import { CommitsInfo } from '../../aggregate-types/all-commits';

// ============================ CALCULATE THE TOTAL NUMBER OF COMMITS, THE FIRST AND THE LAST COMMIT ================================
// Read the entire commits collection from mongo and calculates total number of commits as well as the first and the last commit
export function commitsInfo(connectionString: string, dbName: string, commitsCollection: string) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the commits sorted by date
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection(commitsCollection);
            const aggregationPipeline = [
                { $sort: { authorDate: 1 } },
                {
                    $group: {
                        _id: null,
                        first: { $first: '$$ROOT' },
                        last: { $last: '$$ROOT' },
                        count: { $sum: 1 },
                    },
                },
            ];
            return aggregateObs(coll, aggregationPipeline) as Observable<CommitsInfo>;
        }),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            complete: () => {
                console.log(`====>>>> Tot number of commits calculated from ${dbName}.${commitsCollection}`);
            },
        }),
    );
}
