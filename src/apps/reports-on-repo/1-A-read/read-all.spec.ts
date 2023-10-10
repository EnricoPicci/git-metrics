import { expect } from 'chai';
import { deleteFileObs, readLinesObs } from 'observable-fs';
import { catchError, concatMap, forkJoin, of, tap } from 'rxjs';
import { readAllParallel } from './read-all';
import { GitLogCommitParams } from '../../../git-functions/git-params';
import { ClocParams } from '../../../cloc-functions/cloc-params';

describe(`readAllParallel`, () => {
    it.only(`performs all the read operations concurrently`, (done) => {
        const outDir = `${process.cwd()}/temp`;
        const outFile = 'read-all-concurrent';

        const gitCommitConfig: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const clocConfig: ClocParams = {
            folderPath: './src',  // cloc only on src to speed up the test
            outDir,
            outClocFilePrefix: `${outFile}-`,
            vcs: '',  // since we are looking into ./src folder which is not a git repo, we do not need to specify any vcs
        };

        let _paths: string[];
        readAllParallel(gitCommitConfig, clocConfig)
            .pipe(
                tap({
                    next: ([gitLogPath, clocByFilePath, clocSummaryPath]) => {
                        expect(gitLogPath.length).gt(0);
                        expect(clocByFilePath.length).gt(0);
                        expect(clocSummaryPath.length).gt(0);
                    },
                }),
                concatMap((paths) => {
                    _paths = paths;
                    return forkJoin(paths.map((path) => readLinesObs(path)));
                }),
                tap({
                    next: (linesReadArray) => {
                        // check that some lines have been written to the files
                        linesReadArray.forEach((linesRead) => {
                            expect(linesRead.length).gt(1);
                        });
                    },
                }),
                concatMap(() => {
                    return forkJoin(_paths.map((path) => deleteFileObs(path))).pipe(
                        tap(() => done())
                    );
                }),
                catchError((err) => {
                    done(err);
                    return of(null);
                }),
            )
            .subscribe();
    }).timeout(10000);
});
