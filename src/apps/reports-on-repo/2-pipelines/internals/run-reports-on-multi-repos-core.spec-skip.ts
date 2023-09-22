import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import {
    fetchAllGitReposFromGivenFolder,
    gitRepos,
} from './run-reports-on-multi-repos-core';

describe(`gitRepos`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, (done) => {
        const start = path.parse(process.cwd()).dir;
        gitRepos(start)
            .pipe(
                tap({
                    next: (repos) => {
                        expect(repos).not.undefined;
                        expect(repos.length).gt(0);
                        const currentFolder = process.cwd();
                        expect(repos.includes(currentFolder)).true;
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`fetchAllGitReposFromGivenFolder`, () => {
    it(`returns the folders that contain git repos starting from the folder containing this project`, () => {
        const start = path.parse(process.cwd()).dir;
        const repos = fetchAllGitReposFromGivenFolder(start);
        // in the parent folder of this folder there cab be other git repos
        expect(repos.length).gte(1);
    });
});
