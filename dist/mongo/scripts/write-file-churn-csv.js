"use strict";
//  node ./dist/mongo/scripts/write-file-churn-csv -s mongodb://localhost:27017 --dbName tempDb -c io-backend-files -d $HOME/temp
//  node ./dist/mongo/scripts/write-file-churn-csv -s mongodb://localhost:27017 --dbName tempDb -c io-backend-files -d $HOME/temp
//  node ./dist/mongo/scripts/write-file-churn-csv -s mongodb://localhost:27017 --dbName tempDb -c io-backend-files -a 2021-01-01 -d $HOME/temp
//
// In order wrote the file churn cvs, move to the folder containing the repo and run the following command (remember to compile)
// npm run tsc
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/mongo/scripts/write-file-churn-csv -s mongodb://localhost:27017 --dbName gitMetrics -c io-backend-commits-files -a 2021-01-01 -d $HOME/temp
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const read_git_1 = require("../../read/read-git");
const file_churn_query_1 = require("../query/file-churn-query");
const DEFAULT_DB_NAME = 'git-metrics';
const program = new commander_1.Command();
program
    .description('A command that reads the collection with file details (loaded with load-mongo command) and writes a csv with files churn data')
    .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
    .option('--dbName <string>', `name of the db to use (${DEFAULT_DB_NAME} is the defalt)`, `${DEFAULT_DB_NAME}`)
    .requiredOption('-c, --collName <string>', `name of the collection that contains the files information`)
    .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
    .option('-d, --outDir <string>', `folder where the log file will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
    .option('-o, --outFile <number>', `name of the lof file written $(default is the name of the repo)`);
program.parse(process.argv);
const options = program.opts();
const after = new Date(options.after);
const outFile = options.outFile ? options.outFile : `${options.collName}-files-churn.csv`;
const csvFilePath = path_1.default.join(options.outDir, outFile);
(0, file_churn_query_1.writeFilesChurnToCsv)(options.connStr, options.dbName, options.collName, after, csvFilePath).subscribe({
    error: console.error,
    complete: () => console.log(`====>>>> DONE`),
});
//# sourceMappingURL=write-file-churn-csv.js.map