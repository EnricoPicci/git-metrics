"use strict";
//  node ./dist/mongo/scripts/load-git-log -l ./test-data/output/git-repo-3-commits.gitlog -s mongodb://localhost:27017 -d tempDb -c tempColl -b 10
//  node ./dist/mongo/scripts/load-git-log -l ./test-data/output/git-repo-2-commits.gitlog -s mongodb://localhost:27017 -d tempDb -c tempColl -b 10 --clocLogPath ./test-data/output/git-repo-2-cloc.gitlog
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const load_commits_1 = require("../load/load-commits");
const DEFAULT_DB_NAME = 'git-metrics';
const program = new commander_1.Command();
program
    .description('A command to read the git commit data from a file (created with command "read-git-log") and load it into a mongo db')
    .requiredOption('-l, --logPath <string>', 'path of the log file containing the commit info')
    .option('--clocLogPath <string>', 'path of the log file containing the cloc info')
    .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
    .option('-d, --dbName <string>', `name of the db to use (${DEFAULT_DB_NAME} is the defalt)`, `${DEFAULT_DB_NAME}`)
    .option('-c, --collName <string>', `name of the collection to use (the name of the log file is the defalt)`)
    .option('-b, --buffer <number>', `size of the batches of documents for the load operation`);
program.parse(process.argv);
const options = program.opts();
(0, load_commits_1.loadAllCommits)(options.logPath, options.connStr, options.dbName, options.collName, options.buffer, options.clocLogPath).subscribe({
    error: console.error,
    complete: () => console.log(`====>>>> DONE`),
});
//# sourceMappingURL=load-git-log.js.map