"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorChurn = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ CALCULATE THE AUTHOR CHURN READING FILES INFO FROM A MONGO COLLECTION ================================
// read the files collection from mongo and calculates, for each author, the total number of lines added and deleted,
// the total number of commits, the first and the last commit
function authorChurn(connectionString, dbName, filesCollection, commitsCollection, after) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // calculate the commits by author
    (0, operators_1.concatMap)(() => {
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
        return (0, observable_mongo_1.aggregateObs)(coll, aggregationPipeline).pipe((0, operators_1.toArray)(), (0, operators_1.map)((authorCommits) => authorCommits.reduce((dict, val) => {
            if (dict[val._id]) {
                throw new Error(`The author ${val._id} found more than once in the array used to build the dictionary of author->numberOfCommits`);
            }
            dict[val._id] = val.commits;
            return dict;
        }, {})));
    }), 
    // read the files sorted by author name (the name of the author of commit)
    (0, operators_1.concatMap)((authorCommitsDict) => {
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
        return (0, observable_mongo_1.aggregateObs)(coll, aggregationPipeline).pipe((0, operators_1.map)((authorChurn) => {
            const commits = authorCommitsDict[authorChurn.authorName];
            if (!commits) {
                throw new Error(`The author ${authorChurn.authorName} should have some commits`);
            }
            return Object.assign(Object.assign({}, authorChurn), { commits });
        }));
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Churn for each file calculated from ${dbName}.${filesCollection}`);
        },
    }));
}
exports.authorChurn = authorChurn;
//# sourceMappingURL=author-churn-query.js.map