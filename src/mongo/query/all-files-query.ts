import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { aggregateObs, connectObs } from 'observable-mongo';
import { AllFiles } from '../../1-C-aggregate-types/all-files';

// ============================ CALCULATE THE TOTAL NUMBER OF FILES AND TOTAL CHURN FROM THE FILES MONGO COLLECTION ================================
// Read the entire files collection from mongo and calculates total number of files and the total churn, i.e. the total
// number of lines added and deleted
export function allFiles(connectionString: string, dbName: string, filesCollection: string) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // read the files sorted by file name (path)
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection(filesCollection);
            const aggregationPipeline = [
                {
                    $group: {
                        _id: '$path',
                        cloc: { $first: '$cloc' },
                        linesAdded: { $sum: '$linesAdded' },
                        linesDeleted: { $sum: '$linesDeleted' },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totNumFiles: { $sum: 1 },
                        totCloc: { $sum: '$cloc' },
                        totLinesAdded: { $sum: '$linesAdded' },
                        totLinesDeleted: { $sum: '$linesDeleted' },
                    },
                },
                { $project: { _id: 0 } },
            ];
            return aggregateObs(coll, aggregationPipeline) as Observable<AllFiles>;
        }),
        // close the client at the end
        finalize(() => _client.close()),
        tap({
            complete: () => {
                console.log(`====>>>> Tot number of files and tot churn calculated from ${dbName}.${filesCollection}`);
            },
        }),
    );
}
