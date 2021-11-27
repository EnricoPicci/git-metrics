import { Command } from 'commander';
import { ConfigReadCommits, ConfigReadCloc } from '../git-read-enrich/config/config';
import { loadAllCommitsFiles } from '../mongo/load/load-commits-files';
import { DEFAULT_OUT_DIR } from '../git-read-enrich/read-git';
import { readAll } from '../git-read-enrich/read-all';

const DEFAULT_DB_NAME = 'git-metrics';

const program = new Command();

program
    .description('A command to read a git repo and load the commit and files info into a mongo db')
    .option(
        '-r, --repo <string>',
        'path to the folder containing the repo (the current folder name is the default)',
        `${process.cwd()}`,
    )
    .option(
        '-f, --filter <string...>',
        `optional filter to be used (e.g. '*.ts*' - make sure the filer is between single quotes)`,
    )
    .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
    .option(
        '-d, --outDir <string>',
        `folder where the log file will be written (default ${DEFAULT_OUT_DIR})`,
        `${DEFAULT_OUT_DIR}`,
    )
    .option('-o, --outFile <string>', `name of the log file written (default is the name of the repo)`)
    .option(
        '--outClocFile <string>',
        'log file containing the cloc info (default is the name of the repo with -cloc postfix)',
    )
    .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
    .option('--dbName <string>', `name of the db to use (${DEFAULT_DB_NAME} is the defalt)`, `${DEFAULT_DB_NAME}`)
    .option('-c, --collName <string>', `name of the collection to use (the name of the log file is the defalt)`)
    .option('-b, --buffer <number>', `size of the batches of documents for the load operation`);

program.parse(process.argv);

const options = program.opts();

const [commitLogPath, clocLogPath] = readAll(options as ConfigReadCommits, options as ConfigReadCloc);

// load all commits and files infot to a mongo collection
loadAllCommitsFiles(
    commitLogPath,
    options.connStr,
    options.dbName,
    options.collName,
    options.buffer,
    clocLogPath,
).subscribe({
    error: (err) => {
        console.error(err);
    },
    complete: () => console.log(`====>>>> DONE`),
});
