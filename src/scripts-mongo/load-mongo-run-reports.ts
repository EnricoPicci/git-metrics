import path from 'path';
import { Command } from 'commander';
import { DEFAULT_OUT_DIR } from '../read/read-git';
import { loadMongRunReports } from './internals/load-mongo-run-reports-core';
import { addProjectInfoConsiderations } from '../reports/report';

export function launchLoadMongoRunReports() {
    const program = new Command();

    program
        .description(
            'A command to read a git repo, load the commit and files info into a mongo db and then run the reports',
        )
        .option(
            '-r, --repo <string>',
            'path to the folder containing the repo (the current folder name is the default)',
            `${process.cwd()}`,
        )
        .option(
            '-f, --filter <string...>',
            `optional filter to be used (e.g. '*.ts*' to select typescript files - make sure the filer is between single quotes)`,
        )
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option(
            '-d, --outDir <string>',
            `folder where the log file created by git log command will be written (default ${DEFAULT_OUT_DIR})`,
            `${DEFAULT_OUT_DIR}`,
        )
        .option('-o, --outFile <string>', `name of the log file written (default is the name of the repo)`)
        .option(
            '--outClocFile <string>',
            'log file containing the cloc info (default is the name of the repo with -cloc postfix)',
        )
        .requiredOption('-s, --connStr <string>', 'connection string to use to connect to mongo')
        .option('--dbName <string>', `name of the db to use (the name of the repo is the defalt)`)
        .option('-c, --collName <string>', `name of the collection to use (the name of the log file is the defalt)`)
        .option('-b, --buffer <number>', `size of the batches of documents for the load operation`)
        .option(
            '--clocDefsFile <string>',
            `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`,
        )
        .option(
            '--logProgress <boolean>',
            `logs the progress in loading the mongo db with documents (default is false)`,
            false,
        )
        .option('--mongoConcurrency <number>', `concurrency level used in insert and update operations`, '1');

    program.parse(process.argv);

    const _options = program.opts();
    const _repoFolderPath = _options.repoFolderPath ? _options.repoFolderPath : process.cwd();
    const _dbName = _options.dbName ? _options.dbName : path.parse(_repoFolderPath).name;
    const _buffer = _options.buffer ? parseInt(_options.buffer) : undefined;
    const _mongoConcurrency = parseInt(_options.mongoConcurrency);

    loadMongRunReports(
        _options.connStr,
        _repoFolderPath,
        _options.filter,
        _options.after,
        _options.outDir,
        _options.outFile,
        _options.outClocFile,
        _dbName,
        _options.collName,
        _buffer,
        _options.clocDefsFile,
        _options.logProgress,
        _mongoConcurrency,
    ).subscribe({
        next: (reports) => {
            const _reports = addProjectInfoConsiderations(reports);
            _reports.forEach((report) => report.considerations.forEach((l) => console.log(l)));
        },
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
