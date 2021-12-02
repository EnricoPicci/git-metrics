import { Command } from 'commander';
import { DEFAULT_OUT_DIR } from '../1-A-read/read-git';
import { allReports, runReports } from './internals/run-reports-on-repo-core';

export function launchReports() {
    const program = new Command();

    program
        .description('A command to read a git repo and then run all the reports')
        .option(
            '--reports <string...>',
            `reports to be run (the default is all reports: ${allReports.join(
                ' ',
            )}) - report names have to be specified with single
quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'`,
        )
        .option(
            '-r, --repoFolderPath <string>',
            'path to the folder containing the repo (the current folder name is the default)',
            `${process.cwd()}`,
        )
        .option(
            '-f, --filter <string...>',
            `optional filters to be used (e.g. '*.ts*' or to select typescript files - make sure the filer is between single quotes. 
If more than one filter has to be specified, make sure they are separated by a space like this -f '*.c' '*.sh')`,
        )
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-b, --before <string>', `date to end (format YYYY-MM-DD)`)
        .option(
            '-d, --outDir <string>',
            `folder where the log file created by git log command will be written (default ${DEFAULT_OUT_DIR})`,
            `${DEFAULT_OUT_DIR}`,
        )
        .option(
            '-o, --outFilePrefix <string>',
            `the prefix of the name of the log file written as result of creating a report (default is the name of the repo)`,
        )
        .option(
            '--clocDefsFile <string>',
            `path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/#Options)`,
        )
        .option(
            '-p, --parallelReadOfCommits',
            `if this opion is specified, then the file containing the commit records is read in parallel in the processing of all reports, this can reduce the memory consumption`,
        )
        .option('--noRenames', `if this opion is specified, then the no-renames option is used in the git log command`)
        .option(
            '--depthInFilesCoupling <string>',
            `if we sort the files for number of commits, we consider for coupling only the ones with more commits, i.e. the ones which remain within depthInFilesCoupling (default value is 10)`,
            `10`,
        );
    program.parse(process.argv);

    const _options = program.opts();
    const _reports = _options.reports ?? allReports;
    const _repoFolderPath = _options.repoFolderPath ? _options.repoFolderPath : process.cwd();
    const _depthInFilesCoupling = parseInt(_options.depthInFilesCoupling);

    runReports(
        _reports,
        _repoFolderPath,
        _options.filter,
        _options.after,
        _options.before,
        _options.outDir,
        _options.outFilePrefix,
        _options.clocDefsFile,
        _options.parallelReadOfCommits,
        _options.noRenames,
        _depthInFilesCoupling,
    ).subscribe({
        next: (reports) => {
            reports.forEach((report) => {
                console.log('\n', '\n');
                report.considerations.forEach((l) => {
                    console.log(l);
                });
            });
        },
        error: (err) => {
            console.error(err);
        },
        complete: () => console.log(`====>>>> DONE`),
    });
}
