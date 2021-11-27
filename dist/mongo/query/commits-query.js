"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commits = void 0;
const operators_1 = require("rxjs/operators");
const observable_mongo_1 = require("observable-mongo");
// ============================ READ THE COMMITS ================================
// read the commits collection
function commits(connectionString, dbName, commitsCollection, after) {
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
    }), 
    // close the client at the end
    (0, operators_1.finalize)(() => _client.close()), (0, operators_1.tap)({
        complete: () => {
            console.log(`====>>>> Commits read from ${dbName}.${commitsCollection}`);
        },
    }));
}
exports.commits = commits;
//# sourceMappingURL=commits-query.js.map