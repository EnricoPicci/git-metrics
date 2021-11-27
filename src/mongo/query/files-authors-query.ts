import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';
import { aggregateObs, connectObs } from 'observable-mongo';
import { FileAuthors } from '../../aggregate-types/file-authors';

// ============================ CALCULATE HOW MANY AUTHORS EACH FILE HAS ================================
// read the files collection from mongo and calculates, for each file, the number of authors that have committed at least once that file
export function fileAuthors(connectionString: string, dbName: string, filesCollection: string, after?: Date) {
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
                        _id: {
                            path: '$path',
                            authorName: '$authorName',
                        },
                        path: { $first: '$path' },
                        authorName: { $first: '$authorName' },
                        cloc: { $first: '$cloc' },
                        linesAdded: { $sum: '$linesAdded' },
                        linesDeleted: { $sum: '$linesDeleted' },
                        commits: { $count: {} },
                        created: { $first: '$created' },
                    },
                },
                {
                    $sort: { path: 1, authorName: 1 },
                },
                {
                    $group: {
                        _id: {
                            path: '$path',
                        },
                        path: { $first: '$path' },
                        authors: { $count: {} },
                        cloc: { $first: '$cloc' },
                        linesAdded: { $sum: '$linesAdded' },
                        linesDeleted: { $sum: '$linesDeleted' },
                        commits: { $sum: '$commits' },
                        created: { $first: '$created' },
                    },
                },
                { $project: { _id: 0 } },
                {
                    $addFields: { linesAddDel: { $add: ['$linesAdded', '$linesDeleted'] } },
                },
                {
                    $sort: { authors: 1 },
                },
            ];
            return aggregateObs(coll, aggregationPipeline) as Observable<FileAuthors>;
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
