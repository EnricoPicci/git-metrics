"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitsInfo = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ CALCULATE THE TOTAL NUMBER OF COMMITS, THE FIRST AND THE LAST COMMIT ================================
// Read the entire commits collection from mongo and calculates total number of commits as well as the first and the last commit
function commitsInfo(connectionString, dbName, commitsCollection) {
    // local variable for the mongo client so that, at the end, we can close it
    let _client;
    // connects to the mongo db
    return (0, observable_mongo_1.connectObs)(connectionString).pipe(
    // save the mongo client in a local variable so that, at the end, we can close it
    (0, operators_1.tap)((client) => (_client = client)), 
    // read the commits sorted by date
    (0, operators_1.concatMap)(() => {
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
        return (0, observable_mongo_1.aggregateObs)(coll, aggregationPipeline);
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Tot number of commits calculated from ${dbName}.${commitsCollection}`);
        },
    }));
}
exports.commitsInfo = commitsInfo;
//# sourceMappingURL=all-commits-query.js.map