"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAuthors = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ CALCULATE HOW MANY AUTHORS EACH FILE HAS ================================
// read the files collection from mongo and calculates, for each file, the number of authors that have committed at least once that file
function fileAuthors(connectionString, dbName, filesCollection, after) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // read the files sorted by file name (path)
    (0, operators_1.concatMap)(() => {
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
        return (0, observable_mongo_1.aggregateObs)(coll, aggregationPipeline);
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Churn for each file calculated from ${dbName}.${filesCollection}`);
        },
    }));
}
exports.fileAuthors = fileAuthors;
//# sourceMappingURL=files-authors-query.js.map