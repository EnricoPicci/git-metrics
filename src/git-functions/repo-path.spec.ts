import { expect } from "chai";
import { tap } from "rxjs";
import { gitRepoPaths$, fetchAllGitReposFromGivenFolder } from "./repo-path.functions";


describe(`gitRepoPaths`, () => {
    it(`returns one folder since we start from the folder containing the current project and this folder is a git repo`, (done) => {
        const start = process.cwd();
        gitRepoPaths$(start)
            .pipe(
                tap({
                    next: (repos) => {
                        expect(repos).not.undefined;
                        expect(repos.length).equal(1);
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
    it(`returns no folders since we start from the folder containing the current project and this folder does not have any folder which has its own git repo`, () => {
        const start = process.cwd();
        const repos = fetchAllGitReposFromGivenFolder(start);
        // in the folder of this project there is just one git repo
        expect(repos.length).equal(1);
    });
});