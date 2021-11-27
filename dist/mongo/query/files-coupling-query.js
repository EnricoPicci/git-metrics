"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesCoupling = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ CALCULATE HOW MANY TIMES 2 FILES ARE COMMITTED AT THE SAME TIME ================================
// read the commits collection and calculates, for each file, in how many commits it was present and how many times it was committed together
// with each other file
// see https://stackoverflow.com/questions/69274377/mongo-query-to-join-elements-of-arrays-contained-in-documents/69276098#69276098
function filesCoupling(connectionString, dbName, commitsCollection, after) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db and drop the collection if it exists
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // read the commits
    (0, operators_1.concatMap)(() => {
        const db = _client.db(dbName);
        const coll = db.collection(commitsCollection);
        const queryCondition = after ? { authorDate: { $gte: after } } : {};
        return (0, observable_mongo_1.findObs)(coll, queryCondition);
        // const filterDateStage = after ? [{ $match: { authorDate: { $gte: after } } }] : [];
        // const aggregationPipeline = [
        //     ...filterDateStage,
        //     {
        //         $set: {
        //             f: {
        //                 $map: {
        //                     input: '$files',
        //                     in: {
        //                         file: '$$f',
        //                         commitId: '$_id',
        //                         togetherWith: {
        //                             $setDifference: ['$files', ['$$f']],
        //                         },
        //                     },
        //                     as: 'f',
        //                 },
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             f: 1,
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: '$f',
        //         },
        //     },
        //     {
        //         $replaceRoot: {
        //             newRoot: '$f',
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: '$togetherWith',
        //             preserveNullAndEmptyArrays: true,
        //         },
        //     },
        //     {
        //         $set: {
        //             togetherWith: {
        //                 $ifNull: ['$togetherWith', null],
        //             },
        //         },
        //     },
        //     {
        //         $group: {
        //             _id: '$file',
        //             howManyCommits: {
        //                 $addToSet: '$commitId',
        //             },
        //             together: {
        //                 $push: {
        //                     togetherWith: '$togetherWith',
        //                     howManyTimes: 1,
        //                 },
        //             },
        //         },
        //     },
        //     {
        //         $set: {
        //             fileInfo: '$_id',
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //         },
        //     },
        //     {
        //         $set: {
        //             howManyCommits: {
        //                 $size: '$howManyCommits',
        //             },
        //         },
        //     },
        //     {
        //         $unwind: {
        //             path: '$together',
        //         },
        //     },
        //     {
        //         $replaceRoot: {
        //             newRoot: {
        //                 $mergeObjects: ['$together', '$$ROOT'],
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             together: 0,
        //         },
        //     },
        //     // {
        //     //     $group: {
        //     //         _id: {
        //     //             file: '$fileInfo.path',
        //     //             togetherWith: '$togetherWith.path',
        //     //         },
        //     //         howManyCommits: {
        //     //             $first: '$howManyCommits',
        //     //         },
        //     //         howManyTimes: {
        //     //             $sum: '$howManyTimes',
        //     //         },
        //     //     },
        //     // },
        //     // {
        //     //     $replaceRoot: {
        //     //         newRoot: {
        //     //             $mergeObjects: ['$_id', '$$ROOT'],
        //     //         },
        //     //     },
        //     // },
        //     // {
        //     //     $project: {
        //     //         _id: 0,
        //     //     },
        //     // },
        // ];
        // return aggregateObs(coll, aggregationPipeline);
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Coupling of each file with each other file calculated from ${dbName}.${commitsCollection}`);
        },
    }));
}
exports.filesCoupling = filesCoupling;
//# sourceMappingURL=files-coupling-query.js.map