"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allFiles = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ CALCULATE THE TOTAL NUMBER OF FILES AND TOTAL CHURN FROM THE FILES MONGO COLLECTION ================================
// Read the entire files collection from mongo and calculates total number of files and the total churn, i.e. the total
// number of lines added and deleted
function allFiles(connectionString, dbName, filesCollection) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // read the files sorted by file name (path)
    (0, operators_1.concatMap)(() => {
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
        return (0, observable_mongo_1.aggregateObs)(coll, aggregationPipeline);
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Tot number of files and tot churn calculated from ${dbName}.${filesCollection}`);
        },
    }));
}
exports.allFiles = allFiles;
//# sourceMappingURL=all-files-query.js.map