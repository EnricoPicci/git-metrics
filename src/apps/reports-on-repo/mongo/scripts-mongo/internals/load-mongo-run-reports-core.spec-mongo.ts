import { expect } from 'chai';
import { tap } from 'rxjs';
import { addProjectInfoConsiderations } from '../../../1-D-reports/report';
import { loadMongRunReports } from './load-mongo-run-reports-core';

describe(`loadMongRunReports`, () => {
    it(`read git, load mongo and run the reports on this project and its repo`, (done) => {
        const connectionString = 'mongodb://localhost:27017';
        const repoFolderPath = process.cwd();
        const filter = ['*.ts*'];
        const after = '2021-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const outClocFile = undefined;
        const dbName = 'io-backend';
        const collName = undefined;
        const buffer = undefined;
        const clocDefsPath = undefined;
        const logProgress = false;

        loadMongRunReports(
            connectionString,
            outDir,
            repoFolderPath,
            dbName,
            after,
            filter,
            outFile,
            outClocFile,
            collName,
            buffer,
            clocDefsPath,
            logProgress,
        )
            .pipe(
                tap((reports) => {
                    expect(reports).not.undefined;
                    const _reports = addProjectInfoConsiderations(reports);
                    _reports.forEach((report) => report.considerations.forEach((l) => console.log(l)));
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});
