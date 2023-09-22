import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { tap, concatMap, finalize, toArray, map } from 'rxjs/operators';
import { connectObs, aggregateObs } from 'observable-mongo';
import { AuthorChurn } from '../../1-C-aggregate-types/author-churn';

// ============================ CALCULATE THE AUTHOR CHURN READING FILES INFO FROM A MONGO COLLECTION ================================
// read the files collection from mongo and calculates, for each author, the total number of lines added and deleted,
// the total number of commits, the first and the last commit
export function authorChurn(
    connectionString: string,
    dbName: string,
    filesCollection: string,
    commitsCollection: string,
    after?: Date,
) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client: MongoClient;
    // connects to the mongo db and drop the collection if it exists
    return connectObs(connectionString).pipe(
        // save the mongo client in a local variable so that, at the end, we can close it
        tap((client) => (_client = client)),
        // calculate the commits by author
        concatMap(() => {
            const db = _client.db(dbName);
            const coll = db.collection(commitsCollection);
            const filterStage = after ? [{ $match: { authorDate: { $gte: after } } }] : [];
            const aggregationPipeline = [
                ...filterStage,
                {
                    $group: {
                        _id: '$authorName',
                        // commits: { $count: {} },
                        commits: { $sum: 1 },
                    },
                },
            ];
            return (aggregateObs(coll, aggregationPipeline) as Observable<{ _id: string; commits: number }>).pipe(
                toArray(),
                map((authorCommits) =>
                    authorCommits.reduce((dict, val) => {
                        if (dict[val._id]) {
                            throw new Error(
                                `The author ${val._id} found more than once in the array used to build the dictionary of author->numberOfCommits`,
                            );
                        }
                        dict[val._id] = val.commits;
                        return dict;
                    }, {} as { [author: string]: number }),
                ),
            );
        }),
        // read the files sorted by author name (the name of the author of commit)
        concatMap((authorCommitsDict) => {
            const db = _client.db(dbName);
            const coll = db.collection(filesCollection);
            const filterStage = after ? [{ $match: { authorDate: { $gte: after } } }] : [];
            const aggregationPipeline = [
                { $match: { linesAdded: { $gte: 0 } } },
                { $sort: { authorDate: 1 } },
                ...filterStage,
                {
                    $group: {
                        _id: '$authorName',
                        authorName: { $first: '$authorName' },
                        linesAdded: { $sum: '$linesAdded' },
                        linesDeleted: { $sum: '$linesDeleted' },
                        firstCommit: { $first: '$authorDate' },
                        lastCommit: { $last: '$authorDate' },
                    },
                },
                { $project: { _id: 0 } },
                {
                    $addFields: { linesAddDel: { $add: ['$linesAdded', '$linesDeleted'] } },
                },
                { $sort: { linesAddDel: -1 } },
            ];
            return (aggregateObs(coll, aggregationPipeline) as Observable<AuthorChurn>).pipe(
                map((authorChurn) => {
                    const commits = authorCommitsDict[authorChurn.authorName];
                    if (!commits) {
                        throw new Error(`The author ${authorChurn.authorName} should have some commits`);
                    }
                    return { ...authorChurn, commits } as AuthorChurn;
                }),
            );
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
