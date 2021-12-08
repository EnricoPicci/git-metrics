import { expect } from 'chai';
import { deleteFileObs, readLinesObs } from 'observable-fs';
import { concatMap, forkJoin, tap } from 'rxjs';
import { readAllParallel } from './read-all';
import { ConfigReadCloc, ConfigReadCommits } from './read-params/read-params';

describe(`readAllConcurrent`, () => {
    it(`performs all the read operations concurrently`, () => {
        const repoFolderPath = process.cwd();
        const outDir = `${process.cwd()}/temp`;
        const outFile = 'read-all-concurrent';

        const gitCommitConfig: ConfigReadCommits = {
            repoFolderPath,
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const clocConfig: ConfigReadCloc = {
            repoFolderPath,
            outDir,
            outClocFilePrefix: `${outFile}-`,
        };

        let _paths: string[];
        readAllParallel(gitCommitConfig, clocConfig)
            .pipe(
                tap({
                    next: (paths) => {
                        paths.forEach((path) => {
                            expect(path.length).gt(1);
                        });
                    },
                }),
                concatMap((paths) => {
                    _paths = paths;
                    return forkJoin(paths.map((path) => readLinesObs(path)));
                }),
                tap({
                    next: (linesReadArray) => {
                        linesReadArray.forEach((linesRead) => {
                            expect(linesRead.length).gt(1);
                        });
                    },
                }),
                concatMap(() => {
                    return forkJoin(_paths.map((path) => deleteFileObs(path)));
                }),
            )
            .subscribe();
    });
});
