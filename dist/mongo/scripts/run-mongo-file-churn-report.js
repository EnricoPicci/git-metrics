"use strict";
// In order to run the report, move to the folder containing the repo and run the following command (remember to compile)
// npm run tsc
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/mongo/scripts/run-mongo-file-churn-report -s mongodb://localhost:27017 --dbName gitMetrics -c io-backend-commits-files -a 2021-01-01 -d $HOME/temp
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/mongo/scripts/run-mongo-file-churn-report -s mongodb://localhost:27017 --dbName gitMetrics -c io-app-commits-files -a 2021-01-01 -d $HOME/temp
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const read_git_1 = require("../../read/read-git");
const mongo_file_churn_report_1 = require("../report/mongo-file-churn-report");
const DEFAULT_DB_NAME = 'git-metrics';
const program = new commander_1.Command();
program
    .description('A command that run the file churn report using data stored in mongo (loaded with load-mongo command)')
    .option('-r, --repo <string>', 'path to the folder containing the repo (the current folder name is the default)', `${process.cwd()}`)
    .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
    .option('--dbName <string>', `name of the db to use (${DEFAULT_DB_NAME} is the defalt)`, `${DEFAULT_DB_NAME}`)
    .requiredOption('-c, --collName <string>', `name of the collection that contains the files information`)
    .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
    .option('-d, --outDir <string>', `folder where the log file will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`);
program.parse(process.argv);
const options = program.opts();
const after = new Date(options.after);
const outFile = options.outFile ? options.outFile : `${options.collName}-files-churn.csv`;
const csvFilePath = path_1.default.join(options.outDir, outFile);
(0, mongo_file_churn_report_1.mongoFileChurnReportWithProjectInfo)({
    repoFolderPath: options.repo,
    connectionString: options.connStr,
    dbName: options.dbName,
    filesCollection: options.collName,
    after,
}, csvFilePath).subscribe({
    next: (report) => console.log(JSON.stringify(report.considerations, null, 2)),
    error: console.error,
    complete: () => console.log(`====>>>> DONE`),
});
//# sourceMappingURL=run-mongo-file-churn-report.js.map