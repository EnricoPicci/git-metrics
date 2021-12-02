import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { aggregateObs, connectObs } from 'observable-mongo';
import { FileChurn } from '../../1-C-aggregate-types/file-churn';

// ============================ CALCULATE THE FILE CHURN READING FILES INFO FROM A MONGO COLLECTION ================================
// read the files collection from mongo and calculates, for each file, the total number of lines added and deleted
export function fileChurn(connectionString: string, dbName: string, filesCollection: string, after?: Date) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the files sorted by file name (path)
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection(filesCollection);
            const filterDateStage = after ? [{ $match: { authorDate: { $gte: after } } }] : [];
            const aggregationPipeline = [
                { $match: { linesAdded: { $gte: 0 } } },
                ...filterDateStage,
                {
                    $group: {
                        _id: '$path',
                        path: { $first: '$path' },
                        cloc: { $first: '$cloc' },
                        linesAdded: { $sum: '$linesAdded' },
                        linesDeleted: { $sum: '$linesDeleted' },
                        commits: { $count: {} },
                        created: { $first: '$created' },
                    },
                },
                { $project: { _id: 0 } },
                {
                    $addFields: { linesAddDel: { $add: ['$linesAdded', '$linesDeleted'] } },
                },
                { $sort: { linesAddDel: -1 } },
            ];
            return aggregateObs(coll, aggregationPipeline) as Observable<FileChurn>;
        }),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            complete: () => {
                console.log(`====>>>> Churn for each file calculated from ${dbName}.${filesCollection}`);
            },
        }),
    );
}
