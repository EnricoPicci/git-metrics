"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const load_commits_files_1 = require("../load/load-commits-files");
const read_git_1 = require("../../reports-on-repos/1-A-read/read-git");
const read_all_1 = require("../../reports-on-repos/1-A-read/read-all");
const DEFAULT_DB_NAME = 'git-metrics';
const program = new commander_1.Command();
program
    .description('A command to read a git repo and load the commit and files info into a mongo db')
    .option('-r, --repo <string>', 'path to the folder containing the repo (the current folder name is the default)', `${process.cwd()}`)
    .option('-f, --filter <string...>', `optional filter to be used (e.g. '*.ts*' - make sure the filter is between single quotes)`)
    .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
    .option('-d, --outDir <string>', `folder where the log file will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
    .option('-o, --outFile <string>', `name of the log file written (default is the name of the repo)`)
    .option('--outClocFile <string>', 'log file containing the cloc info (default is the name of the repo with -cloc postfix)')
    .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
    .option('--dbName <string>', `name of the db to use (${DEFAULT_DB_NAME} is the defalt)`, `${DEFAULT_DB_NAME}`)
    .option('-c, --collName <string>', `name of the collection to use (the name of the log file is the defalt)`)
    .option('-b, --buffer <number>', `size of the batches of documents for the load operation`);
program.parse(process.argv);
const options = program.opts();
const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(options, options);
// load all commits and files infot to a mongo collection
(0, load_commits_files_1.loadAllCommitsFiles)(commitLogPath, options.connStr, options.dbName, options.collName, options.buffer, clocLogPath).subscribe({
    error: (err) => {
        console.error(err);
    },
    complete: () => console.log(`====>>>> DONE`),
});
//# sourceMappingURL=load-mongo.js.map