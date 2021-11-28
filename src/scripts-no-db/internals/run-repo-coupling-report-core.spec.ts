import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { runRepoCouplingReport } from './run-repo-coupling-report-core';

describe(`runRepoCouplingReport`, () => {
    it(`read git, runs cloc and run the reports on this project and its repo`, (done) => {
        const repoFolderPath_1 = process.cwd();
        const repoFolderPath_2 = process.cwd();
        const timeWindowLengthInDays = 1;
        const csvFilePath = path.join(process.cwd(), 'temp', 'this-repo-coupling-with-itself.csv');
        const filter = ['*.ts'];
        const after = '2017-01-01';
        const outDir = `${process.cwd()}/temp`;
        const outFile = undefined;
        const outClocFile = undefined;
        const clocDefsPath = undefined;

        runRepoCouplingReport(
            [repoFolderPath_1, repoFolderPath_2],
            timeWindowLengthInDays,
            csvFilePath,
            filter,
            after,
            outDir,
            outFile,
            outClocFile,
            clocDefsPath,
        )
            .pipe(
                tap((csvFile) => {
                    expect(csvFile).not.undefined;
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(600000);
});
